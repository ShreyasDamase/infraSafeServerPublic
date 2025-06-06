import geolib from "geolib";
import jwt from "jsonwebtoken";
import Citizen from "../models/Citizen.js";
import Helper from "../models/Helper.js";
import cookie from "cookie";
import SubAdmin from "../models/SubAdmin.js";
import * as turf from "@turf/turf";
import Complaint from "../models/Complaint.js";

const onDutyHelpers = new Map();
export const subadmins = new Map();
const helperZones = new Map(); // helperId => [zoneNames]
console.log("📍 helperZones:", Array.from(helperZones.entries()));

const handleSocketConnection = (io) => {
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.headers.access_token;

      if (!token && socket.handshake.headers.cookie) {
        console.log("inside dashboar logic");
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        token = cookies.access_token;
      }
      if (!token) return next(new Error("Authentication invalid: No token"));
      console.log("her in socket", token);
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("playload 🪐", payload);
      // const user = await User.findById(payload.id);
      const user =
        (await Citizen.findById(payload.id)) ||
        (await Helper.findById(payload.id)) ||
        (await SubAdmin.findById(payload.id));

      if (!user) {
        return next(new Error("Authentication invalid: User not found"));
      }
      console.log("user:", user);

      socket.user = {
        id: payload.id,
        role: user.role,
        zone: user.zone,
        name: user?.name,
        department: user?.department,
        post: user?.departmentPost,
      };
      next();
    } catch (error) {
      console.error("Socket Auth Error:", error);
      next(new Error("Authentication invalid: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`User Joined: ${user.id} (${user.role})`);
    console.log(`Socket connected: ${socket.id}`);

    // if (user.role === "citizen") {

    // }

    if (user.role === "subadmin") {
      try {
        console.log("🔍 Zone received:", JSON.stringify(user.zone, null, 2));

        const zoneGeoJSON = user.zone?.area;
        console.log("zone jisos ", zoneGeoJSON);
        if (
          !zoneGeoJSON ||
          !zoneGeoJSON.coordinates ||
          zoneGeoJSON.coordinates.length === 0
        ) {
          throw new Error("Subadmin zone data is missing or invalid");
        }

        const polygon = turf.polygon(zoneGeoJSON.coordinates);
        subadmins.set(socket.id, {
          subadminId: user.id,
          zoneName: user.zone.name,
          name: user.name,

          polygon,
          subadminId: user.id,
        });
        console.log(
          `✅ Subadmin ${user.id} auto-registered zone ${user.zone.name}`
        );
      } catch (e) {
        console.error(
          `❌ Failed to auto-register zone for subadmin ${user.id}`,
          e
        );
      }
    }

    if (user.role === "helper") {
      socket.on("goOnDuty", (coords) => {
        console.log("go on duty called");
        console.log(coords);
        onDutyHelpers.set(user.id, {
          socketId: socket.id,
          coords,
          name: user.name,
          department: user.department,
          departmentPost: user.departmentPost,
        });
        socket.join("onDuty");
        console.log(`helper ${user.id} , ${user.name}is now on duty.`);
        updateNearbyriders();
      });

      socket.on("goOffDuty", () => {
        onDutyHelpers.delete(user.id);
        helperZones.delete(user.id); // 👈 remove zone mapping

        socket.leave("onDuty");
        console.log(`rider ${user.id} is now off duty.`);
        updateNearbyriders();
      });

      socket.on("updateLocation", (coords) => {
        if (onDutyHelpers.has(user.id)) {
          onDutyHelpers.get(user.id).coords = coords;
          console.log(`rider ${user.id} updated location.`);
          updateNearbyriders();
          socket.to(`rider_${user.id}`).emit("riderLocationUpdate", {
            riderId: user.id,
            coords,
          });
        }
      });
    }
    socket.on("getHelper", (zoneName) => {
      console.log("Requesting helpers for zone:", zoneName);

      const zoneGeoJSONCoords = [
        [73.83649135456909, 18.57536836673836],
        [73.82636951335567, 18.603108625019516],
        [73.80912878190395, 18.60867272442323],
        [73.80634149891452, 18.584836639647946],
        [73.80555986489384, 18.5769420777886],
        [73.81415481214114, 18.56819611481724],
        [73.82918187042497, 18.567891044127435],
        [73.83247121396411, 18.57364564108029],
        [73.83649135456909, 18.57536836673836],
      ];

      const polygon = turf.polygon([zoneGeoJSONCoords]);

      const helpersInZone = [];

      // Loop through all on-duty helpers
      for (const [helperId, helperData] of onDutyHelpers.entries()) {
        const point = turf.point([
          helperData.coords.longitude,
          helperData.coords.latitude,
        ]);

        const isInside = turf.booleanPointInPolygon(point, polygon);

        if (isInside) {
          helpersInZone.push({
            helperId,
            ...helperData,
          });
        }
      }

      console.log(
        `✅ Found ${helpersInZone.length} helpers inside zone ${zoneName}`
      );

      // Emit back to subadmin who asked
      socket.emit("helpersInZone", { zone: zoneName, helpers: helpersInZone });
    });
    if (user.role === "customer") {
      socket.on("subscribeToZone", (customerCoords) => {
        socket.user.coords = customerCoords;
        sendNearbyRiders(socket, customerCoords);
      });

      socket.on("searchrider", async (rideId) => {
        try {
          const ride = await Ride.findById(rideId).populate("customer rider");
          if (!ride) return socket.emit("error", { message: "Ride not found" });

          const { latitude: pickupLat, longitude: pickupLon } = ride.pickup;

          let retries = 0;
          let rideAccepted = false;
          let canceled = false;
          const MAX_RETRIES = 20;

          const retrySearch = async () => {
            if (canceled) return;
            retries++;

            const riders = sendNearbyRiders(
              socket,
              { latitude: pickupLat, longitude: pickupLon },
              ride
            );
            if (riders.length > 0 || retries >= MAX_RETRIES) {
              clearInterval(retryInterval);
              if (!rideAccepted && retries >= MAX_RETRIES) {
                await Ride.findByIdAndDelete(rideId);
                socket.emit("error", {
                  message: "No riders found within 5 minutes.",
                });
              }
            }
          };

          const retryInterval = setInterval(retrySearch, 10000);

          socket.on("rideAccepted", () => {
            rideAccepted = true;
            clearInterval(retryInterval);
          });

          socket.on("cancelRide", async () => {
            canceled = true;
            clearInterval(retryInterval);
            await Ride.findByIdAndDelete(rideId);
            socket.emit("rideCanceled", { message: "Ride canceled" });

            if (ride.rider) {
              const riderSocket = getRiderSocket(ride.rider._id);
              riderSocket?.emit("rideCanceled", {
                message: `Customer ${user.id} canceled the ride.`,
              });
            }
            console.log(`Customer ${user.id} canceled ride ${rideId}`);
          });
        } catch (error) {
          console.error("Error searching for rider:", error);
          socket.emit("error", { message: "Error searching for rider" });
        }
      });
    }

    socket.on("subscribeToriderLocation", (riderId) => {
      const rider = onDutyHelpers.get(riderId);
      if (rider) {
        socket.join(`rider_${riderId}`);
        socket.emit("riderLocationUpdate", { riderId, coords: rider.coords });
        console.log(
          `User ${user.id} subscribed to rider ${riderId}'s location.`
        );
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId).populate("customer rider");
        socket.emit("rideData", rideData);
      } catch (error) {
        socket.emit("error", { message: "Failed to receive ride data" });
      }
    });

    socket.on("assignHelper", async ({ complaintId, helperId }) => {
      console.log("aasign helper called");
      const complaint = await Complaint.findById(complaintId);
      if (!complaint)
        return socket.emit("error", { message: "Complaint not found" });

      complaint.assignedHelper = helperId;
      complaint.status = "assigned";
      await complaint.save();
      function getHelperSocket(helperId) {
        const helper = onDutyHelpers.get(helperId);
        return helper ? io.sockets.sockets.get(helper.socketId) : null;
      }

      const helperSocket = getHelperSocket(helperId);
      if (helperSocket) {
        helperSocket.emit("assignHelper", {
          complaintId,
          helperId,
          complaintData: complaint, // optionally send full data
        });
        console.log(`Assigned helper ${helperId} to complaint ${complaintId}`);
      } else {
        console.log(`Helper ${helperId} is not online, but complaint saved.`);
      }
    });
    socket.on("disconnect", () => {
      if (user.role === "rider") onDutyHelpers.delete(user.id);
      console.log(`${user.role} ${user.id} disconnected.`);
    });

    // function updateNearbyriders() {
    //   io.sockets.sockets.forEach((socket) => {
    //     if (socket.user?.role === "subadmin") {
    //       const subAdminCoords = socket.user.zone;
    //       console.log(subAdminCoords);
    //       // if (customerCoords) sendNearbyRiders(socket, customerCoords);
    //     }
    //   });
    // }
    function updateNearbyriders() {
      for (const [subSocketId, subadminData] of subadmins.entries()) {
        const { zoneName, polygon } = subadminData;

        const helpersInZone = [];

        for (const [helperId, helperData] of onDutyHelpers.entries()) {
          const point = turf.point([
            helperData.coords.longitude,
            helperData.coords.latitude,
          ]);

          if (turf.booleanPointInPolygon(point, polygon)) {
            helpersInZone.push({
              helperId,
              ...helperData,
            });

            // Update mapping
            const prevZones = helperZones.get(helperId) || [];
            if (!prevZones.includes(zoneName)) {
              helperZones.set(helperId, [...prevZones, zoneName]);
            }
          }
        }

        // Emit updated list to subadmin
        const subadminSocket = io.sockets.sockets.get(subSocketId);
        if (subadminSocket) {
          subadminSocket.emit("helpersInZone", {
            zone: zoneName,
            helpers: helpersInZone,
          });
        }
      }
    }

    function sendNearbyRiders(socket, location, ride = null) {
      const nearbyriders = Array.from(onDutyHelpers.values())
        .map((rider) => ({
          ...rider,
          distance: geolib.getDistance(rider.coords, location),
        }))
        .filter((rider) => rider.distance <= 60000)
        .sort((a, b) => a.distance - b.distance);

      socket.emit("nearbyriders", nearbyriders);

      if (ride) {
        nearbyriders.forEach((rider) => {
          io.to(rider.socketId).emit("rideOffer", ride);
        });
      }

      return nearbyriders;
    }

    function getRiderSocket(riderId) {
      const rider = onDutyHelpers.get(riderId);
      return rider ? io.sockets.sockets.get(rider.socketId) : null;
    }
  });

  io.engine.on("connection_error", (err) => {
    console.log("Engine connection error:", err);
  });
};

export default handleSocketConnection;
