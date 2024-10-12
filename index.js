const mongoose = require("mongoose");
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

module.exports = class MongoDB {
  #mongoDBURL;
  #dataSchema;
  #unknownError = {
    error: "Unknown error",
    message: "An unknown error occurred.",
    code: -4,
  };

  constructor(mongoDBURL) {
    this.#mongoDBURL = mongoDBURL;
    this.#dataSchema = new mongoose.Schema({}, { strict: false });
  }

  async getConnection() {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const connectionString = `${this.#mongoDBURL}`;
      const options = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      };
      cached.promise = mongoose
        .connect(connectionString, options)
        .then((mongoose) => mongoose.connection);
    }
    cached.conn = await cached.promise;
    return cached.conn;
  }

  async getModel(collection, dbName) {
    const connection = await this.getConnection();
    return connection.useDb(dbName).model(collection, this.#dataSchema);
  }

  async getDB(dbName) {
    const connection = await this.getConnection();
    return connection.useDb(dbName);
  }

  async getDataByQuery(
    dbName,
    collection,
    query,
    projection = {},
    isMultiple = false
  ) {
    const model = await this.getModel(collection, dbName);
    const response = await model[isMultiple ? "find" : "findOne"](
      query,
      projection
    ).sort({ "data.date": 1 });
    if (response) {
      return {
        data: isMultiple ? response : { ...response._doc, _id: response._id },
        code: 0,
      };
    } else {
      return null;
    }
  }

  async getDataWithPagination(
    dbName,
    collection,
    query = {},
    page = 1,
    pageSize = 10,
    projection = {}
  ) {
    const model = await this.getModel(collection, dbName);
    const skip = (page - 1) * pageSize;
    const data = await model.find(query, projection).skip(skip).limit(pageSize);
    const totalCount = await model.countDocuments(query);

    return {
      data,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      code: 0,
    };
  }

  async findAndUpdateByQuery(
    dbName,
    collection,
    query,
    updateData,
    options = { upsert: true, new: true, useFindAndModify: false }
  ) {
    const model = await this.getModel(collection, dbName);
    const result = await model.findOneAndUpdate(query, updateData, options);
    return {
      message: "Query updated successfully.",
      code: 0,
      result: result,
    };
  }

  async bulkFindAndUpdateByQueries(
    dbName,
    collection,
    queryDataPairs,
    options = { upsert: true, new: true }
  ) {
    const model = await this.getModel(collection, dbName);
    const bulkOperations = queryDataPairs.map(({ query, data }) => ({
      updateOne: {
        filter: query,
        update: { $set: data },
        ...options,
      },
    }));
    const result = await model.bulkWrite(bulkOperations);
    return {
      message: "Queries updated successfully.",
      code: 0,
      result: result,
    };
  }

  async deleteByQuery(dbName, collection, query) {
    const db = await this.getDB(dbName);
    const model = db.model(collection, this.#dataSchema);
    const result = await model.deleteOne(query);
    return {
      message: "Query deleted successfully.",
      code: 0,
      result: result,
    };
  }

  async deleteAllData(dbName, collection) {
    const db = await this.getDB(dbName);
    try {
      await db.dropCollection(collection);
      return {
        message: "All data deleted successfully.",
        code: 0,
      };
    } catch (error) {
      if (error.message === "ns not found") {
        return {
          message: "Collection does not exist, or already deleted",
          code: 0,
        };
      } else {
        throw { ...this.#unknownError, errorObject: error };
      }
    }
  }

  async getAllData(dbName, collection, projection = {}) {
    const model = await this.getModel(collection, dbName);
    const response = await model.find({}, projection);
    return {
      data: response.map((item) => item.toObject()), // Return the full document
      code: 0,
    };
  }

  async addData(dbName, collection, data) {
    const model = await this.getModel(collection, dbName);
    const item = new model(data); // Store data directly at the root level
    await item.save();
    return item;
  }

  async atlasSearch(
    dbName,
    collection,
    queryText,
    path,
    isMultiple,
    fuzzyOptions = { maxEdits: 2, prefixLength: 3, maxExpansions: 100 },
    limit = 10
  ) {
    try {
      const model = await this.getModel(collection, dbName);
      const searchQuery = [
        {
          $search: {
            index: "default",
            text: {
              query: queryText,
              path: path,
              fuzzy: fuzzyOptions,
            },
          },
        },
        {
          $limit: limit,
        },
      ];

      const result = await model.aggregate(searchQuery).exec();

      if (result.length > 0) {
        return { data: isMultiple ? result : result[0], code: 0 };
      } else {
        return {
          error: "No Results",
          message: "No documents matched the query.",
          code: -1,
        };
      }
    } catch (error) {
      console.error("Search error:", error);
      return { ...this.#unknownError, errorObject: error };
    }
  }

  async aggregate(dbName, collection, pipeline) {
    const model = await this.getModel(collection, dbName);
    return await model.aggregate(pipeline).exec();
  }

  async createIndex(dbName, collection, fields, options) {
    const db = await this.getDB(dbName);
    const model = db.model(collection, this.#dataSchema);
    await model.collection.createIndex(fields, options);
  }

  async getRandomDistinctDocuments(dbName, collection, query, limit = 5) {
    const model = await this.getModel(collection, dbName);
    const pipeline = [
      { $match: query },
      { $sample: { size: limit } },
      {
        $group: {
          _id: "$data.information.job_title",
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
    ];
    return await model.aggregate(pipeline).exec();
  }

  async closeConnection() {
    if (cached.conn) {
      await cached.conn.close();
      console.log("MongoDB connection closed successfully.");
      cached.conn = null;
    }
  }
};
