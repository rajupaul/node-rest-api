// use this rules as unique:seed
// unique:<Mongoose Model>,<Field Name>,<ID to Ignore, This is optional>

const niv = require('node-input-validator');
const mongoose = require('mongoose');

niv.extend('unique', async ({ value, args }) => {
  // default field is email in this example
  const field = args[1] || 'email';

  let condition = {};

  condition[field] = value;

  // add ignore condition
  if (args[2]) {
    condition['_id'] = { $ne: mongoose.Types.ObjectId(args[2]) };
  }

  let emailExist = await mongoose.model(args[0]).findOne(condition).select(field);

  // email already exists
  if (emailExist) {
    return false;
  }

  return true;
});
