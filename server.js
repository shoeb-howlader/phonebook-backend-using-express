const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/contacts_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Secret key for JWT (use a strong, unique secret in production)
const JWT_SECRET = 'your_very_secret_key_here_replace_in_production';

// User Schema for Admin
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  mobile: { type: String },
  image: { type: String },
  position: { type: String },
  designation: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, 'contact-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB file size limit
});

// Automatic Admin Setup Function
async function setupInitialAdmin() {
  try {
    // Check if any admin user already exists
    const existingAdmin = await User.findOne();
    
    if (!existingAdmin) {
      // No admin exists, create a new one
      const defaultUsername = 'admin';
      const defaultPassword = 'adminPassword123!';
      
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const newAdmin = new User({ 
        username: defaultUsername, 
        password: hashedPassword 
      });
      
      await newAdmin.save();
      console.log('Initial admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error setting up initial admin:', error);
  }
}

// Middleware to verify JWT
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware for error handling
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all contacts sorted by position (no authentication required)
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ position: 1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

// Get single contact by ID (requires admin authentication)
app.get('/api/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contact' });
  }
});

// Add new contact (requires admin authentication)
app.post('/api/contacts', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const contact = new Contact({
      name: req.body.name,
      phone: req.body.phone,
      mobile: req.body.mobile,
      position: req.body.position,
      designation: req.body.designation,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    const savedContact = await contact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ error: 'Error creating contact', details: error.message });
  }
});

// Update contact (requires admin authentication)
app.put('/api/contacts/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    // Find the contact first to get the old image path
    const existingContact = await Contact.findById(req.params.id);
    
    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Prepare update data
    const updateData = {
      name: req.body.name,
      phone: req.body.phone,
      mobile: req.body.mobile,
      position: req.body.position,
      designation: req.body.designation
    };

    // Handle image update
    if (req.file) {
      // Add new image path
      updateData.image = `/uploads/${req.file.filename}`;
      
      // Delete old image if it exists
      if (existingContact.image) {
        const oldImagePath = path.join(__dirname, existingContact.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Update the contact
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // This option returns the updated document
    );

    res.json(updatedContact);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ error: 'Error updating contact', details: error.message });
  }
});

// Delete contact (requires admin authentication)
app.delete('/api/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    // Find the contact first to get the image path
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Delete the image file if it exists
    if (contact.image) {
      const imagePath = path.join(__dirname, contact.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the contact from database
    await Contact.findByIdAndDelete(req.params.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete error:', error);
    res.status(400).json({ error: 'Error deleting contact', details: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Call the setup function when the server starts
mongoose.connection.once('open', () => {
  setupInitialAdmin();
});

// Start server
const PORT = process.env.PORT || 3000;

// sendFile will go here
app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});