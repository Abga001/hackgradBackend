const Joi = require("joi");

// Registration validation function
const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    fullName: Joi.string().allow(""),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
    }),
    bio: Joi.string().max(500).allow(""),
    profileImage: Joi.string().uri().allow(""),
    skills: Joi.array().items(Joi.string().trim()),
    areaOfExpertise: Joi.string().allow(""),

    education: Joi.array().items(
      Joi.object({
        institution: Joi.string().allow(""),
        degree: Joi.string().allow(""),
        fieldOfStudy: Joi.string().allow(""),
        startYear: Joi.number().min(1900).max(new Date().getFullYear() + 10),
        endYear: Joi.number().min(1900).max(new Date().getFullYear() + 10),
      })
    ),

    experience: Joi.array().items(
      Joi.object({
        company: Joi.string().allow(""),
        position: Joi.string().allow(""),
        startDate: Joi.date(),
        endDate: Joi.date().allow(null),
        description: Joi.string().allow(""),
      })
    ),

    favoriteLanguages: Joi.array().items(Joi.string().trim()),
    github: Joi.string().uri().allow(""),
    linkedin: Joi.string().uri().allow(""),
    portfolio: Joi.string().uri().allow(""),
  });

  return schema.validate(data);
};

// Login validation function
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
};