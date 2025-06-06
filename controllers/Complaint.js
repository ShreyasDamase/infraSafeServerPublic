import Complaint from "../models/Complaint.js";
import { zones } from "../zone.js";
import { subadmins } from "./sockets.js";
import * as turf from "@turf/turf";

export const submiteComplaint = async (req, res) => {
  console.log("submite hitt");
  try {
    // Validate required fields first
    if (!req.body.complaint || !req.body.coords || !req.body.user) {
      console.log("here");
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Parse inputs
    const {
      complaint: complaintName,
      address,
      detail: complaintDetail,
      coords: coordsString,
      user: userString,
    } = req.body;

    let coords;
    let user;

    try {
      coords = JSON.parse(coordsString);
      user = JSON.parse(userString);
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid JSON in request data" });
    }

    // Validate coordinates
    if (!coords.latitude || !coords.longitude) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Get files
    const picture = req.files["pictureData"]?.[0];
    const video = req.files["videoData"]?.[0];

    // const complaintPoint = turf.point([
    //   complaint.coords.longitude,
    //   complaint.coords.latitude,
    // ]);
    // console.log(complaintPoint);
    // for (const [socketId, subadmin] of subadmins.entries()) {
    //   const { polygon, zoneName } = subadmin;
    //   console.log(polygon);
    //   if (turf.booleanPointInPolygon(complaintPoint, polygon)) {
    //     console.log(`📡 Sending complaint to subadmin in zone: ${zoneName}`);
    //     req.io.to(socketId).emit("zoneComplaint", {
    //       complaint,
    //       zone: zoneName,
    //     });
    //   }
    // }

    // Find the responsible subadmin zone using Turf.js
    console.log(coords.latitude, coords.longitude);
    const complaintPoint = turf.point([coords.latitude, coords.longitude]); // Note: Turf expects [lng, lat]
    let socketId = null;
    // let zoneName = null;

    // for (const [currentSocketId, subadmin] of subadmins.entries()) {
    //   if (turf.booleanPointInPolygon(complaintPoint, subadmin.polygon)) {
    //     zoneName = subadmin.zoneName;
    //     socketId = currentSocketId;
    //     console.log(zoneName, socketId);
    //     break; // Exit loop once we find the matching zone
    //   }
    // }
    // console.log("zn", zoneName);

    let zoneName = null;
    const turfPoint = turf.point([coords.latitude, coords.longitude]); // Correct order: [lng, lat]

    for (const zone of zones) {
      const turfPolygon = turf.polygon(zone.area.coordinates);
      if (turf.booleanPointInPolygon(turfPoint, turfPolygon)) {
        zoneName = zone.name;
        break;
      }
    }
    if (!zoneName) {
      return res
        .status(400)
        .json({ message: "No subadmin zone found for these coordinates" });
    }

    const complaintToDepartmentMap = {
      pipeline_leak: "sewage_drainage",
      manhole_repair: "sewage_drainage",
      need_new_sewage: "sewage_drainage",

      fire: "fire_department",

      road_damage: "pwd",

      electrical_fault: "electricity_board",

      water_supply: "water_supply",

      garbage_overflow: "waste_management",

      tree_cutting: "forest_department",
      illegal_construction: "town_planning",

      other: "urban_development", // Default/fallback
    };

    // Step 2: Assign department using complaintName
    const complaintDepartment =
      complaintToDepartmentMap[complaintName] || "urban_development";
    // Create complaint object
    const complaintData = {
      complaintName,
      complaintDepartment,
      complaintDetail,
      address,
      user: {
        userId: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        aadhaar: user.aadhaar,
      },
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude, // Fixed the coordinate swap from original code
      },
      zone: zoneName,
      ...(picture && {
        picture: {
          filename: picture.filename,
          originalname: picture.originalname,
          mimetype: picture.mimetype,
          size: picture.size,
          path: picture.path,
        },
      }),
      ...(video && {
        video: {
          filename: video.filename,
          originalname: video.originalname,
          mimetype: video.mimetype,
          size: video.size,
          path: video.path,
        },
      }),
    };

    // Save to database
    const complaint = new Complaint(complaintData);
    console.log(complaint);
    await complaint.save();
    for (const [socketId, subadmin] of subadmins.entries()) {
      if (subadmin.zoneName === zoneName) {
        req.io.to(socketId).emit("zoneComplaint", {
          complaint,
          zone: zoneName,
        });
      }
    }

    // Notify the appropriate subadmin
    console.log("heres sock id", socketId);
    if (socketId) {
      console.log("imside trigger");
      req.io.to(socketId).emit("zoneComplaint", {
        complaint,
        zone: zoneName,
      });
    }

    // Send response
    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: {
        complaintId: complaint._id,
        zone: zoneName,
        picture: picture?.filename,
        video: video?.filename,
      },
    });
  } catch (error) {
    console.error("Complaint submission error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getComplaint = async (req, res) => {
  console.log("inside complint fetch");
  const { zoneName } = req.query;
  console.log("her", zoneName);
  try {
    if (!zoneName || typeof zoneName !== "string") {
      return res.status(400).json({ message: "zoneName is required" });
    }

    const complaints = await Complaint.find({ zone: zoneName }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Codmplaints fetched successfully",
      complaints,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
