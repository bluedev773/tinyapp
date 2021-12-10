const getUserByEmail = function(email, database) {
  for(const key in database) {
    if(database[key].email === email) {
      const user = database[key];
      return user;
    }
  }
  return null;
};

module.exports = { getUserByEmail };