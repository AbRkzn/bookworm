import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !rating) {
      return res.status(400).json({ message: "Please provide an fields" });
    }
    // upload the image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    // save to the database

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.log("Errpr creating book", error);
    res.status(500).json({ message: error.message });
  }
});

// pagination => infinite loading
router.get("/", protectRoute, async (req, res) => {
  //example call from react native - frontend
  //const response = await fetch("http://localhost:3000/api/book?page=1&limit=5");
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 }) //descending order
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();

    res.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    //check if user is the creator of the book

    if (book.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    // delete image from cloudinary as well
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split("."[0]);
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await book.deleteOne();

    res.json({ message: "Book delete successfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.log("Get user books error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;

// import express from "express";
// import cloudinary from "../lib/cloudinary.js";
// import Book from "../models/Book.js";
// import protectRoute from "../middleware/auth.middleware.js";

// const router = express.Router();

// // ------------------------- CREATE BOOK -------------------------
// router.post("/", protectRoute, async (req, res) => {
//   try {
//     const { title, caption, rating, image } = req.body;

//     if (!image || !title || !rating) {
//       return res.status(400).json({ message: "Please provide all fields" });
//     }

//     // ✅ Upload the image to Cloudinary
//     const uploadResponse = await cloudinary.uploader.upload(image);

//     const imageUrl = uploadResponse.secure_url;
//     const publicId = uploadResponse.public_id; // ✅ save public_id for easier deletion later

//     // ✅ Save to the database
//     const newBook = new Book({
//       title,
//       caption,
//       rating,
//       image: imageUrl,
//       imagePublicId: publicId, // <-- store publicId
//       user: req.user._id,
//     });

//     await newBook.save();

//     res.status(201).json(newBook);
//   } catch (error) {
//     console.log("Error creating book", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // ------------------------- GET ALL BOOKS (Pagination) -------------------------
// router.get("/", protectRoute, async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const limit = req.query.limit || 2;
//     const skip = (page - 1) * limit;

//     const books = await Book.find()
//       .sort({ createdAt: -1 }) // descending order
//       .skip(skip)
//       .limit(limit)
//       .populate("user", "username profileImage");

//     const totalBooks = await Book.countDocuments();

//     res.send({
//       books,
//       currentPage: page,
//       totalBooks,
//       totalPages: Math.ceil(totalBooks / limit),
//     });
//   } catch (error) {
//     console.log("Error in get all books route", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ------------------------- DELETE BOOK -------------------------
// router.delete("/:id", protectRoute, async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.id);
//     if (!book) return res.status(404).json({ message: "Book not found" });

//     // check if user is the creator of the book
//     if (book.user.toString() !== req.user._id.toString()) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // ✅ delete image from Cloudinary
//     if (book.imagePublicId) {
//       try {
//         await cloudinary.uploader.destroy(book.imagePublicId); // use stored public_id
//       } catch (deleteError) {
//         console.log("Error deleting image from Cloudinary", deleteError);
//       }
//     } else if (book.image && book.image.includes("cloudinary")) {
//       // fallback if imagePublicId not stored (old data)
//       try {
//         // ✅ FIXED: Correct way to extract public_id from Cloudinary URL
//         const publicId = book.image
//           .split("/")
//           .slice(-2) // e.g. ["uploads", "myimage.jpg"]
//           .join("/") // "uploads/myimage.jpg"
//           .split(".")[0]; // "uploads/myimage"

//         await cloudinary.uploader.destroy(publicId);
//       } catch (deleteError) {
//         console.log("Error extracting public_id", deleteError);
//       }
//     }

//     await book.deleteOne();

//     res.json({ message: "Book deleted successfully" });
//   } catch (error) {
//     console.log("Error deleting book", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ------------------------- GET BOOKS BY USER -------------------------
// router.get("/user", protectRoute, async (req, res) => {
//   try {
//     const books = await Book.find({ user: req.user._id }).sort({
//       createdAt: -1,
//     });
//     res.json(books);
//   } catch (error) {
//     console.log("Get user books error:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// export default router;
