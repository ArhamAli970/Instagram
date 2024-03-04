const Joi=require('joi');
// const { model } = require('mongoose');

module.exports.profileSchema=Joi.object({
    pic:Joi.string().required(),
    bio:Joi.string().allow("")
})