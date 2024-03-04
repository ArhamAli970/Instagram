const Joi = require('joi');

module.exports.postSchema=Joi.object({
    url:Joi.string().required(),
    caption:Joi.string().allow(""),
});