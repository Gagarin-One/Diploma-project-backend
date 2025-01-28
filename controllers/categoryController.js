const { Category } = require('../models/models');

class CategoryController {
  async getAll(req, res) {
    try{
      let category = await Category.findAll();

      return res.json(category);
    }catch(error){
      next(ApiError.badRequest(error.message));
    }

  }
}

module.exports = new CategoryController();

