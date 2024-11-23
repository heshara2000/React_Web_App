const router = require("express").Router()
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("../models/user");
const { Route } = require("react-router");

/* configuration Multer for file upoad */
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, "public/uploads/") //store uplloaded files in upload folder
    },
    filename: function(req, file,cb){
        cb(null, file.originalname) //use the original file name

    }
})

const upload = multer({ storage})

/*user register */
router.post("/register", upload.single('profileImage'), async(req,res) => {
    try {
        /* Take all information from the form */
        const {firstName, lastName, email, password} = req.body
        /* The uploded file avalaible as req.file */
        const profileImage = req.file

        if(!profileImage) {
            return res.status(400).send("no file uploaded")
        }
        /*path to the uploaded profie photo*/
        const profileImagePath = profileImage.path

        /*check if user exists */
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({message: "User already exists!"})
        }
        /* hass the password */
        const salt = await bcrypt.genSalt()
        const hashPassword = await bcrypt.hash(password,salt)
        /* create a new user */
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashPassword,
            profileImagePath,

        }
            
        );
        /* save the new user */
        await newUser.save()

        /* send a successful message */
        res.status(200).json({message: "user registered successfully"});       

    } catch (err) {
        console.log(err)
        res.status(500).json({message: "registration failed", error: err.message});


    }
});

/* USER LOGIN */
router.post("/login", async (req, res) => {
    try {
      /* Take the infomation from the form */
      const { email, password } = req.body
  
      /* Check if user exists */
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(409).json({ message: "User doesn't exist!" });
      }
  
      /* Compare the password with the hashed password */
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials!"})
      }
  
      /* Generate JWT token */
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
      delete user.password
  
      res.status(200).json({ token, user })
  
    } catch (err) {
      console.log(err)
      res.status(500).json({ error: err.message })
    }
  })
  



module.exports = router