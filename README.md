# @ozanozkaya/custom-mongodb

A custom MongoDB Node.js module designed to simplify database operations such as connecting to MongoDB, data retrieval, updates, deletions, and advanced searches, including fuzzy matching. It supports both single and bulk operations, pagination, and integrated error handling for robust application development.

## Features

- **Efficient MongoDB connection management** with cached connections.
- **Simple data operations**: retrieval, insertion, updating, and deletion.
- **Advanced search**: MongoDB Atlas fuzzy text search with customizable options.
- **Pagination support** for retrieving data with limit and offset.
- **Bulk operations**: Efficiently update or delete multiple documents at once.
- **Integrated error handling** for reliable application development.
- **Utility functions**: Aggregation, indexing, random distinct document retrieval.

## Installation

Install the package using npm:

```bash
npm install @ozanozkaya/custom-mongodb
```

## Environment Setup

Ensure your MongoDB credentials and connection string are properly set in your environment variables.

## Usage

### 1. Initialize the MongoDB Manager

To use the package, you first need to initialize it with your MongoDB connection string.

```javascript
const MongoDBManager = require("@ozanozkaya/custom-mongodb");

// Initialize with your MongoDB connection URL
const manager = new MongoDBManager("yourMongoDBURL");
```

### 2. Basic Data Operations

#### Fetch Data by Query

```javascript
manager
  .getDataByQuery(
    "dbName",
    "collectionName",
    { yourQuery },
    { projection },
    true
  )
  .then((data) => console.log("Fetched Data:", data))
  .catch((error) => console.error("Error Fetching Data:", error));
```

#### Fetch Data with Pagination

```javascript
manager
  .getDataWithPagination(
    "dbName",
    "collectionName",
    { yourQuery },
    page,
    pageSize
  )
  .then((data) => console.log("Paginated Data:", data))
  .catch((error) => console.error("Error Fetching Data:", error));
```

#### Insert Data

```javascript
manager
  .addData("dbName", "collectionName", { yourData })
  .then((item) => console.log("Data Added:", item))
  .catch((error) => console.error("Error Adding Data:", error));
```

#### Update Data by Query

```javascript
manager
  .findAndUpdateByQuery("dbName", "collectionName", { query }, { dataToUpdate })
  .then((result) => console.log("Data Updated:", result))
  .catch((error) => console.error("Error Updating Data:", error));
```

#### Bulk Update Operations

```javascript
const queryDataPairs = [
  { query: { _id: 1 }, data: { key: "value1" } },
  { query: { _id: 2 }, data: { key: "value2" } },
];
manager
  .bulkFindAndUpdateByQueries("dbName", "collectionName", queryDataPairs)
  .then((result) => console.log("Bulk Update Successful:", result))
  .catch((error) => console.error("Error in Bulk Update:", error));
```

#### Delete Data by Query

```javascript
manager
  .deleteByQuery("dbName", "collectionName", { query })
  .then((result) => console.log("Data Deleted:", result))
  .catch((error) => console.error("Error Deleting Data:", error));
```

### 3. Advanced Operations

#### MongoDB Atlas Fuzzy Search

```javascript
manager
  .atlasSearch("dbName", "collectionName", "searchTerm", "searchField", true)
  .then((results) => console.log("Search Results:", results))
  .catch((error) => console.error("Error in Search:", error));
```

#### Aggregation Pipeline

```javascript
const pipeline = [{ $match: { status: "active" } }];
manager
  .aggregate("dbName", "collectionName", pipeline)
  .then((results) => console.log("Aggregation Results:", results))
  .catch((error) => console.error("Error Aggregating Data:", error));
```
