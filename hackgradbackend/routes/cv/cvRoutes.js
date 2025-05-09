//cvRoutes.js - Backend API routes
const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const CVProfile = require('../../models/CVProfile');
const User = require('../../models/User');
const PDFDocument = require('pdfkit');

router.get('/search/by-user/:userId', async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOne({ userId: req.params.userId });
    
    if (!cvProfile) {
      return res.status(404).json({ msg: 'CV profile not found for this user' });
    }
    
    res.json(cvProfile);
  } catch (err) {
    console.error('Error searching CV by user:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/all', verifyToken, async (req, res) => {
  try {
    const cvProfiles = await CVProfile.find({ userId: req.user._id });
    res.json(cvProfiles);
  } catch (err) {
    console.error('Error fetching CV profiles:', err);
    res.status(500).send('Server Error');
  }
});

// PDF Generation
router.get('/:id/pdf', verifyToken, async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!cvProfile) return res.status(404).json({ msg: 'CV profile not found' });

    const user = await User.findById(req.user._id).select('username fullName profileImage');
    
    // Create a new PDF document with better settings
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4',
      bufferPages: true,  // Enable buffering to track pages
      info: {
        Title: `CV - ${cvProfile.fullName || user.fullName || user.username}`,
        Author: cvProfile.fullName || user.fullName || user.username,
        Creator: 'Dev Network CV Builder'
      }
    });

    // Set up response headers
    const displayName = cvProfile.fullName || user.fullName || user.username;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cv-${displayName}.pdf"`);
    doc.pipe(res);

    // Define colors from theme
    const primaryColor = cvProfile.theme?.primaryColor || '#4e54c8';
    const secondaryColor = cvProfile.theme?.secondaryColor || '#8f94fb';
    
    // Helper function to draw a section header
    const drawSectionHeader = (text) => {
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(text, { underline: false })
         .moveDown(0.5);
      
      // Draw a line under the header
      doc.strokeColor(primaryColor)
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke();
      
      doc.moveDown(0.5);
    };

    // Helper function to check if I need a new page
    const checkForNewPage = (neededSpace) => {
      if (doc.y + neededSpace > doc.page.height - 50) {
        doc.addPage();
        return true;
      }
      return false;
    };

    // ===== Header Section =====
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor(primaryColor)
       .text(displayName, { align: 'center' });

    if (cvProfile.headline) {
      doc.font('Helvetica')
         .fontSize(16)
         .fillColor('#444')
         .text(cvProfile.headline, { align: 'center' });
    }
    
    doc.moveDown(1);

    // ===== Contact Information =====
    if (cvProfile.contact) {
      doc.fontSize(11).fillColor('#333');
      
      const contactItems = [];
      if (cvProfile.contact.email) contactItems.push(cvProfile.contact.email);
      if (cvProfile.contact.phone) contactItems.push(cvProfile.contact.phone);
      if (cvProfile.contact.location) contactItems.push(cvProfile.contact.location);
      if (cvProfile.contact.website) contactItems.push(cvProfile.contact.website);
      
      if (contactItems.length > 0) {
        doc.text(contactItems.join(' | '), { align: 'center' });
        doc.moveDown(1.5);
      }
    }

    // ===== Summary =====
    if (cvProfile.summary) {
      drawSectionHeader('Professional Summary');
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#333')
         .text(cvProfile.summary, { align: 'left' });
      doc.moveDown(1);
    }

    // ===== Work Experience =====
    if (cvProfile.workExperience?.length > 0) {
      drawSectionHeader('Work Experience');
      
      cvProfile.workExperience.forEach((exp, index) => {
        // Check if I need a new page (estimate 100-150 points per experience entry)
        if (index > 0 && checkForNewPage(150)) {
          drawSectionHeader('Work Experience (continued)');
        }
        
        // Job title and company in bold
        doc.font('Helvetica-Bold')
           .fontSize(13)
           .fillColor('#333')
           .text(exp.title, { continued: true });
        
        doc.font('Helvetica')
           .fontSize(13)
           .text(` at ${exp.company}`, { align: 'left' });
        
        // Location if available
        if (exp.location) {
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#555')
             .text(exp.location);
        }
        
        // Date range
        doc.font('Helvetica-Oblique')
           .fontSize(11)
           .fillColor('#555')
           .text(`${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long'}) : ''} - ${exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long'}) : ''}`);
        
        doc.moveDown(0.5);
        
        // Description
        if (exp.description) {
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#333')
             .text(exp.description);
          
          doc.moveDown(0.5);
        }
        
        // Highlights with bullet points
        if (exp.highlights?.length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(11)
             .text('Key Achievements:');
          
          doc.font('Helvetica')
             .fontSize(11);
          
          exp.highlights.forEach(highlight => {
            doc.fillColor('#333')
               .text(`• ${highlight}`, { indent: 15 });
          });
          
          doc.moveDown(0.5);
        }
        
        // Technologies
        if (exp.technologies?.length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(11)
             .text('Technologies:');
          
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#333')
             .text(exp.technologies.join(', '), { indent: 15 });
        }
        
        doc.moveDown(1.5);
      });
    }

    // ===== Education =====
    if (cvProfile.education?.length > 0) {
      // Check if I need a new page
      if (checkForNewPage(100)) {
        // I'm on a new page already
      } else {
        doc.moveDown(0.5);
      }
      
      drawSectionHeader('Education');
      
      cvProfile.education.forEach((edu, index) => {
        // Check if I need a new page
        if (index > 0 && checkForNewPage(120)) {
          drawSectionHeader('Education (continued)');
        }
        
        // Degree and field of study
        doc.font('Helvetica-Bold')
           .fontSize(13)
           .fillColor('#333')
           .text(`${edu.degree || ''} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}`, { continued: true });
        
        // Institution
        doc.font('Helvetica')
           .fontSize(13)
           .text(` at ${edu.institution}`);
        
        // Years
        doc.font('Helvetica-Oblique')
           .fontSize(11)
           .fillColor('#555')
           .text(`${edu.startYear || ''} - ${edu.current ? 'Present' : edu.endYear || ''}`);
        
        // Description
        if (edu.description) {
          doc.moveDown(0.5)
             .font('Helvetica')
             .fontSize(11)
             .fillColor('#333')
             .text(edu.description);
        }
        
        // Achievements
        if (edu.achievements?.length > 0) {
          doc.moveDown(0.5)
             .font('Helvetica-Bold')
             .fontSize(11)
             .text('Achievements:');
          
          doc.font('Helvetica')
             .fontSize(11);
          
          edu.achievements.forEach(achievement => {
            doc.fillColor('#333')
               .text(`• ${achievement}`, { indent: 15 });
          });
        }
        
        doc.moveDown(1.5);
      });
    }

    // ===== Skills =====
    if (cvProfile.skills?.length > 0) {
      // Check if I need a new page
      if (checkForNewPage(100)) {
        // I'm on a new page already
      } else {
        doc.moveDown(0.5);
      }
      
      drawSectionHeader('Skills');
      
      // Create a grid of skills
      const skillsPerRow = 2;
      const skillWidth = (doc.page.width - 100) / skillsPerRow;
      const skillHeight = 50;
      
      for (let i = 0; i < cvProfile.skills.length; i += skillsPerRow) {
        // Check if I need a new page
        if (i > 0 && checkForNewPage(skillHeight + 20)) {
          drawSectionHeader('Skills (continued)');
        }
        
        for (let j = 0; j < skillsPerRow && i + j < cvProfile.skills.length; j++) {
          const skill = cvProfile.skills[i + j];
          const xPos = 50 + j * skillWidth;
          const yPos = doc.y;
          
          // Skill name
          doc.font('Helvetica-Bold')
             .fontSize(11)
             .fillColor('#333')
             .text(skill.name, xPos, yPos, { width: skillWidth - 10 });
          
          // Skill level
          doc.font('Helvetica')
             .fontSize(10)
             .fillColor('#555')
             .text(`${skill.level} (${skill.yearsOfExperience} ${skill.yearsOfExperience === 1 ? 'year' : 'years'})`, 
                  xPos, yPos + 15, { width: skillWidth - 10 });
          
          // Skill bar background
          doc.rect(xPos, yPos + 30, skillWidth - 10, 10)
             .fillColor('#eee')
             .fill();
          
          // Skill bar progress
          let progressWidth;
          switch (skill.level) {
            case 'Beginner': progressWidth = (skillWidth - 10) * 0.25; break;
            case 'Intermediate': progressWidth = (skillWidth - 10) * 0.5; break;
            case 'Advanced': progressWidth = (skillWidth - 10) * 0.75; break;
            case 'Expert': progressWidth = (skillWidth - 10) * 1; break;
            default: progressWidth = (skillWidth - 10) * 0.5;
          }
          
          doc.rect(xPos, yPos + 30, progressWidth, 10)
             .fillColor(primaryColor)
             .fill();
        }
        
        doc.moveDown(skillHeight / doc.currentLineHeight());
      }
    }

    // ===== Languages =====
    if (cvProfile.languages?.length > 0) {
      // Check if I need a new page
      if (checkForNewPage(100)) {
        // I'm on a new page already
      } else {
        doc.moveDown(0.5);
      }
      
      drawSectionHeader('Languages');
      
      // Create a grid of languages
      const langsPerRow = 2;
      const langWidth = (doc.page.width - 100) / langsPerRow;
      
      for (let i = 0; i < cvProfile.languages.length; i += langsPerRow) {
        // Check if I need a new page
        if (i > 0 && checkForNewPage(30)) {
          drawSectionHeader('Languages (continued)');
        }
        
        for (let j = 0; j < langsPerRow && i + j < cvProfile.languages.length; j++) {
          const lang = cvProfile.languages[i + j];
          const xPos = 50 + j * langWidth;
          const yPos = doc.y;
          
          // Language name and proficiency
          doc.font('Helvetica-Bold')
             .fontSize(11)
             .fillColor('#333')
             .text(lang.name, xPos, yPos, { width: langWidth - 10, continued: true });
          
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#555')
             .text(` - ${lang.proficiency}`, { width: langWidth - 10 });
        }
        
        doc.moveDown(2);
      }
    }

    // ===== Projects =====
    if (cvProfile.projects?.length > 0) {
      // Check if i need a new page
      if (checkForNewPage(150)) {
        // I'm on a new page already
      } else {
        doc.moveDown(0.5);
      }
      
      drawSectionHeader('Projects');
      
      cvProfile.projects.forEach((project, index) => {
        // Check if i need a new page
        if (index > 0 && checkForNewPage(150)) {
          drawSectionHeader('Projects (continued)');
        }
        
        // Project title
        doc.font('Helvetica-Bold')
           .fontSize(13)
           .fillColor('#333')
           .text(project.title);
        
        // Date range
        if (project.startDate || project.endDate) {
          doc.font('Helvetica-Oblique')
             .fontSize(11)
             .fillColor('#555')
             .text(`${project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long'}) : ''} - ${project.current ? 'Present' : project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long'}) : ''}`);
        }
        
        // Project links
        if (project.url || project.repositoryUrl) {
          doc.moveDown(0.5)
             .font('Helvetica')
             .fontSize(10)
             .fillColor(primaryColor);
          
          if (project.url) {
            doc.text(`Live Demo: ${project.url}`);
          }
          
          if (project.repositoryUrl) {
            doc.text(`Repository: ${project.repositoryUrl}`);
          }
        }
        
        // Description
        if (project.description) {
          doc.moveDown(0.5)
             .font('Helvetica')
             .fontSize(11)
             .fillColor('#333')
             .text(project.description);
        }
        
        // Technologies
        if (project.technologies?.length > 0) {
          doc.moveDown(0.5)
             .font('Helvetica-Bold')
             .fontSize(11)
             .text('Technologies:');
          
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#333')
             .text(project.technologies.join(', '), { indent: 15 });
        }
        
        // Highlights
        if (project.highlights?.length > 0) {
          doc.moveDown(0.5)
             .font('Helvetica-Bold')
             .fontSize(11)
             .text('Key Features:');
          
          doc.font('Helvetica')
             .fontSize(11);
          
          project.highlights.forEach(highlight => {
            doc.fillColor('#333')
               .text(`• ${highlight}`, { indent: 15 });
          });
        }
        
        doc.moveDown(1.5);
      });

      if (cvProfile.profileImage && cvProfile.displayOptions?.showProfileImage !== false) {
        try {
          // Get the image path - profileImage now contains a file path like "/uploads/cv-profiles/filename.jpg"
          const imagePath = path.join(__dirname, '../../', cvProfile.profileImage);
          
          // Check if file exists before adding it
          if (fs.existsSync(imagePath)) {
            // Calculate position for centered image
            const imageSize = 100; // Size in points
            const xPos = (doc.page.width - imageSize) / 2;
            
            // Add the image from the file path
            doc.image(imagePath, xPos, doc.y, {
              fit: [imageSize, imageSize],
              align: 'center',
              valign: 'center'
            });
            
            // Add some space after the image
            doc.moveDown(3);
          } else {
            console.log(`Profile image not found at path: ${imagePath}`);
          }
        } catch (imgErr) {
          console.error('Error adding profile image to PDF:', imgErr);
          // Continue without the image if there's an error
        }
      }
    }

    // ===== Footer on each page =====
    // Get total pages only after content is added
    const pageCount = doc.bufferedPageRange().count;
    let pageNum;
    
    for (pageNum = 0; pageNum < pageCount; pageNum++) {
      doc.switchToPage(pageNum);
      
      // Footer at the bottom of the page
      const footerY = doc.page.height - 50;
      
      // Footer text
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#888')
         .text(
           `Generated on ${new Date().toLocaleDateString()} | Page ${pageNum + 1} of ${pageCount}`,
           50,
           footerY,
           { align: 'center', width: doc.page.width - 100 }
         );
    }

    // Finalize and send the PDF
    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Error generating PDF', message: err.message });
  }
});


// GET public CV profile (no auth needed)
router.get('/public/:id', async (req, res) => {
  try {
    const cvProfile = await CVProfile.findById(req.params.id);
    if (!cvProfile?.isPublic) return res.status(404).json({ msg: 'Public CV not found' });
    
    // Get the CV OWNER's information
    const profileOwner = await User.findById(cvProfile.userId).select('username fullName profileImage');
    
    // Include the owner's profile data in the response
    res.json({ 
      ...cvProfile.toObject(), 
      user: profileOwner  // This ensures the owner's data is included
    });
  } catch (err) {
    console.error('Error fetching public CV:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOne({ 
      userId: req.params.userId,
      isPublic: true
    });
    
    if (!cvProfile) {
      return res.status(404).json({ msg: 'CV profile not found' });
    }
    
    // Get user basic info
    const user = await User.findById(req.params.userId).select('username fullName profileImage');
    
    res.json({
      ...cvProfile.toObject(),
      user
    });
  } catch (err) {
    console.error('Error fetching public CV profile:', err);
    res.status(500).send('Server Error');
  }
});


// PUT make profile public
router.put('/public/:id', verifyToken, async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isPublic: true },
      { new: true }
    );
    if (!cvProfile) return res.status(404).json({ msg: 'CV profile not found' });
    res.json(cvProfile);
  } catch (err) {
    console.error('Error making public:', err);
    res.status(500).send('Server Error');
  }
});

// PUT make profile private
router.put('/private/:id', verifyToken, async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isPublic: false },
      { new: true }
    );
    if (!cvProfile) return res.status(404).json({ msg: 'CV profile not found' });
    res.json(cvProfile);
  } catch (err) {
    console.error('Error making private:', err);
    res.status(500).send('Server Error');
  }
});

// PUT set CV as default
router.put('/default/:id', verifyToken, async (req, res) => {
  try {
    // Find the CV profile and verify ownership
    const cvProfile = await CVProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!cvProfile) {
      return res.status(404).json({ msg: 'CV profile not found' });
    }
    
    // Set this CV as default (the pre-save middleware will handle updating others)
    cvProfile.isDefault = true;
    await cvProfile.save();
    
    res.json(cvProfile);
  } catch (err) {
    console.error('Error setting default CV:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/cv-profile/:id/image
// @desc    Update CV profile image
// @access  Private
router.put('/:id/image', verifyToken, async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ msg: 'No image data provided' });
    }
    
    // Find the CV profile
    const cvProfile = await CVProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!cvProfile) {
      return res.status(404).json({ msg: 'CV profile not found' });
    }
    
    // Update with the new image data
    cvProfile.profileImage = imageData;
    
    // Also update lastUpdated timestamp
    cvProfile.lastUpdated = Date.now();
    
    // Save the changes
    await cvProfile.save();
    
    // Return success
    res.json({ 
      success: true, 
      msg: 'Profile image updated successfully',
      profileImage: cvProfile.profileImage 
    });
    
  } catch (err) {
    console.error('Error updating profile image:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }

});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Add logging to help debugging
    console.log(`Updating CV profile with ID: ${req.params.id}`);
    
    // Find and update the CV profile
    const cvProfile = await CVProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    // If not found, return 404
    if (!cvProfile) {
      console.log(`CV profile not found with ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'CV profile not found' });
    }
    
    // Return updated profile
    res.json(cvProfile);
  } catch (err) {
    console.error('Error updating CV profile:', err);
    res.status(500).send('Server Error');
  }
});

// POST duplicate CV profile
router.post('/duplicate/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has reached the maximum number of CVs
    const cvCount = await CVProfile.countDocuments({ userId: req.user._id });
    if (cvCount >= 5) {
      return res.status(400).json({ 
        msg: 'Maximum number of CV profiles reached (5). Please delete an existing CV to create a new one.' 
      });
    }
    
    // Find the CV to duplicate
    const originalCV = await CVProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!originalCV) {
      return res.status(404).json({ msg: 'CV profile not found' });
    }
    
    // Create a duplicate (excluding _id and isDefault)
    const duplicateData = originalCV.toObject();
    delete duplicateData._id;
    delete duplicateData.isDefault;
    
    // Set a new title for the duplicate
    duplicateData.title = `${originalCV.title} (Copy)`;
    
    const newCV = new CVProfile(duplicateData);
    await newCV.save();
    
    res.json(newCV);
  } catch (err) {
    console.error('Error duplicating CV:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/cv-profile/sync
// @desc    Sync CV profile with user profile
// @access  Private
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { sections } = req.body;
    
    // Get user profile
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get or create CV profile
    let cvProfile = await CVProfile.findOne({ userId: req.user._id });
    
    if (!cvProfile) {
      cvProfile = new CVProfile({
        userId: req.user._id,
        isPublic: false
      });
    }
    
    // Sync requested sections
    if (sections.includes('basicInfo')) {
      cvProfile.fullName = user.fullName || user.username;
      cvProfile.headline = user.areaOfExpertise || '';
      cvProfile.summary = user.bio || '';
      cvProfile.contact = {
        email: user.email || '',
        phone: '',
        location: '',
        website: user.portfolio || ''
      };
    }
    
    if (sections.includes('education') && user.education && user.education.length > 0) {
      cvProfile.education = user.education.map(edu => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        startYear: edu.startYear || null,
        endYear: edu.endYear || null,
        current: !edu.endYear,
        description: '',
        achievements: []
      }));
    }
    
    if (sections.includes('experience') && user.experience && user.experience.length > 0) {
      cvProfile.workExperience = user.experience.map(exp => ({
        title: exp.position || '',
        company: exp.company || '',
        location: '',
        startDate: exp.startDate || null,
        endDate: exp.endDate || null,
        current: !exp.endDate,
        description: exp.description || '',
        highlights: [],
        technologies: []
      }));
    }
    
    if (sections.includes('skills') && user.skills && user.skills.length > 0) {
      cvProfile.skills = user.skills.map(skill => ({
        name: skill,
        level: 'Intermediate',
        yearsOfExperience: 1
      }));
    }
    
    if (sections.includes('languages') && user.favoriteLanguages && user.favoriteLanguages.length > 0) {
      cvProfile.languages = user.favoriteLanguages.map(lang => ({
        name: lang,
        proficiency: 'Professional Working'
      }));
    }
    
    // Save updated profile
    await cvProfile.save();
    
    res.json(cvProfile);
  } catch (err) {
    console.error('Error syncing CV profile:', err);
    res.status(500).send('Server Error');
  }
});

// POST new CV profile
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user has reached the maximum number of CVs (5)
    const cvCount = await CVProfile.countDocuments({ userId: req.user._id });
    if (cvCount >= 5) {
      return res.status(400).json({ 
        msg: 'Maximum number of CV profiles reached (5). Please delete an existing CV to create a new one.' 
      });
    }

    // Get user data to initialize fullName
    const user = await User.findById(req.user._id).select('username fullName');
    
    // If this is the first CV, make it default
    const isDefault = cvCount === 0;
    
    const newProfile = new CVProfile({
      userId: req.user._id,
      fullName: user.fullName || user.username,
      title: req.body.title || `CV ${cvCount + 1}`,
      isDefault: isDefault,
      ...req.body
    });
    
    await newProfile.save();
    res.json(newProfile);
  } catch (err) {
    console.error('Error creating CV profile:', err);
    res.status(500).send('Server Error');
  }
});

// DELETE CV profile
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!cvProfile) return res.status(404).json({ msg: 'CV profile not found' });
    res.json({ msg: 'CV profile deleted' });
  } catch (err) {
    console.error('Error deleting CV profile:', err);
    res.status(500).send('Server Error');
  }
});

// GET logged-in user's CV profile
router.get('/', verifyToken, async (req, res) => {
  try {
    let cvProfile = await CVProfile.findOne({ 
      userId: req.user._id,
      isDefault: true
    });
    
    // If no default profile exists, get the first one or return 404
    if (!cvProfile) {
      cvProfile = await CVProfile.findOne({ userId: req.user._id });
      if (!cvProfile) return res.status(404).json({ msg: 'CV profile not found' });
    }
    
    res.json(cvProfile);
  } catch (err) {
    console.error('Error fetching default CV profile:', err);
    res.status(500).send('Server Error');
  }
});

// GET full private CV profile (must be owner)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const cvProfile = await CVProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!cvProfile) return res.status(404).json({ msg: 'CV profile not found' });
    res.json(cvProfile);
  } catch (err) {
    console.error('Error fetching private CV:', err);
    res.status(500).send('Server Error');
  }
});



// @route   GET /api/cv-profile/:userId
// @desc    Get a user's public CV profile
// @access  Public
// router.get('/:userId', async (req, res) => {
//   try {
//     const cvProfile = await CVProfile.findOne({ userId: req.params.userId });
    
//     if (!cvProfile) {
//       return res.status(404).json({ msg: 'CV profile not found' });
//     }
    
//     // Check if profile is public
//     if (!cvProfile.isPublic) {
//       return res.status(403).json({ msg: 'This CV profile is private' });
//     }
    
//     // Get user basic info
//     const user = await User.findById(req.params.userId).select('username fullName profileImage');
    
//     res.json({
//       ...cvProfile.toObject(),
//       user
//     });
//   } catch (err) {
//     console.error('Error fetching public CV profile:', err);
//     res.status(500).send('Server Error');
//   }
// });


module.exports = router;