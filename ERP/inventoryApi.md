warehouse-controller


GET
/api/inventory/warehouses/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.624Z",
    "updatedAt": "2026-08-17T07:42:30.624Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "warehouseCode": "string",
    "warehouseName": "string",
    "warehouseType": "MAIN",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.624Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/warehouses/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "warehouseName": "string",
    "warehouseType": "MAIN",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "status": "string"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.652Z",
    "updatedAt": "2026-08-17T07:42:30.652Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "warehouseCode": "string",
    "warehouseName": "string",
    "warehouseType": "MAIN",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.652Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/warehouses/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.663Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/warehouses

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:41:54.079Z",
  "createdTo": "2026-08-17T07:41:54.079Z",
  "updatedFrom": "2026-08-17T07:41:54.079Z",
  "updatedTo": "2026-08-17T07:41:54.079Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "warehouseCode": "string",
  "warehouseName": "string",
  "warehouseType": "MAIN",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "pinCode": "string",
  "status": "string"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:30.675Z",
      "updatedAt": "2026-08-17T07:42:30.675Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "warehouseCode": "string",
      "warehouseName": "string",
      "warehouseType": "MAIN",
      "addressLine1": "string",
      "addressLine2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "pinCode": "string",
      "status": "string"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.676Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/warehouses

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "warehouseName": "string",
    "warehouseType": "MAIN",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "status": "string"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.692Z",
    "updatedAt": "2026-08-17T07:42:30.692Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "warehouseCode": "string",
    "warehouseName": "string",
    "warehouseType": "MAIN",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.692Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
warehouse-location-controller


GET
/api/inventory/warehouse-locations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.707Z",
    "updatedAt": "2026-08-17T07:42:30.707Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationCode": "string",
    "locationName": "string",
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.707Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/warehouse-locations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationName": "string",
    "isActive": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.732Z",
    "updatedAt": "2026-08-17T07:42:30.732Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationCode": "string",
    "locationName": "string",
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.732Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/warehouse-locations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.750Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/warehouse-locations

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:41:15.893Z",
  "createdTo": "2026-08-17T07:41:15.893Z",
  "updatedFrom": "2026-08-17T07:41:15.893Z",
  "updatedTo": "2026-08-17T07:41:15.893Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "locationCode": "string",
  "locationName": "string",
  "isActive": true
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:30.771Z",
      "updatedAt": "2026-08-17T07:42:30.771Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationCode": "string",
      "locationName": "string",
      "isActive": true
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.771Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/warehouse-locations

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationName": "string",
    "isActive": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.794Z",
    "updatedAt": "2026-08-17T07:42:30.794Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationCode": "string",
    "locationName": "string",
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.794Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
unit-of-measure-controller


GET
/api/inventory/unit-of-measures/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.809Z",
    "updatedAt": "2026-08-17T07:42:30.809Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "code": "string",
    "name": "string",
    "decimalPlaces": 1073741824,
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.809Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/unit-of-measures/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "name": "string",
    "decimalPlaces": 6,
    "isActive": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.840Z",
    "updatedAt": "2026-08-17T07:42:30.840Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "code": "string",
    "name": "string",
    "decimalPlaces": 1073741824,
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.840Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/unit-of-measures/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.851Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/unit-of-measures

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:40:45.095Z",
  "createdTo": "2026-08-17T07:40:45.095Z",
  "updatedFrom": "2026-08-17T07:40:45.095Z",
  "updatedTo": "2026-08-17T07:40:45.095Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "code": "string",
  "name": "string",
  "decimalPlaces": 1073741824,
  "isActive": true
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:30.864Z",
      "updatedAt": "2026-08-17T07:42:30.864Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "code": "string",
      "name": "string",
      "decimalPlaces": 1073741824,
      "isActive": true
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.864Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/unit-of-measures

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "name": "string",
    "decimalPlaces": 6,
    "isActive": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.879Z",
    "updatedAt": "2026-08-17T07:42:30.879Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "code": "string",
    "name": "string",
    "decimalPlaces": 1073741824,
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.879Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
stock-transfer-controller


GET
/api/inventory/stock-transfers/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.889Z",
    "updatedAt": "2026-08-17T07:42:30.889Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "transferNo": "string",
    "transferDate": "2026-08-17T07:42:30.889Z",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:30.889Z",
    "dispatchedAt": "2026-08-17T07:42:30.889Z",
    "receivedAt": "2026-08-17T07:42:30.889Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.889Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/stock-transfers/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "transferNo": "string",
    "transferDate": "2026-08-17T07:42:30.904Z",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:30.904Z",
    "dispatchedAt": "2026-08-17T07:42:30.904Z",
    "receivedAt": "2026-08-17T07:42:30.904Z",
    "lines": [
      {
        "stockTransferId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "quantity": 0,
        "unitCost": 0,
        "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ]
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.907Z",
    "updatedAt": "2026-08-17T07:42:30.907Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "transferNo": "string",
    "transferDate": "2026-08-17T07:42:30.907Z",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:30.907Z",
    "dispatchedAt": "2026-08-17T07:42:30.907Z",
    "receivedAt": "2026-08-17T07:42:30.907Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.907Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/stock-transfers/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.916Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/stock-transfers

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:39:25.614Z",
  "createdTo": "2026-08-17T07:39:25.614Z",
  "updatedFrom": "2026-08-17T07:39:25.614Z",
  "updatedTo": "2026-08-17T07:39:25.614Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "transferNo": "string",
  "transferDate": "2026-08-17T07:39:25.614Z",
  "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "string",
  "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "remarks": "string",
  "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedAt": "2026-08-17T07:39:25.614Z",
  "dispatchedAt": "2026-08-17T07:39:25.614Z",
  "receivedAt": "2026-08-17T07:39:25.614Z"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:30.928Z",
      "updatedAt": "2026-08-17T07:42:30.928Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "transferNo": "string",
      "transferDate": "2026-08-17T07:42:30.928Z",
      "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "status": "string",
      "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "remarks": "string",
      "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedAt": "2026-08-17T07:42:30.928Z",
      "dispatchedAt": "2026-08-17T07:42:30.928Z",
      "receivedAt": "2026-08-17T07:42:30.928Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.928Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-transfers

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "transferNo": "string",
    "transferDate": "2026-08-17T07:42:30.941Z",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:30.941Z",
    "dispatchedAt": "2026-08-17T07:42:30.941Z",
    "receivedAt": "2026-08-17T07:42:30.941Z",
    "lines": [
      {
        "stockTransferId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "quantity": 0,
        "unitCost": 0,
        "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ]
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.946Z",
    "updatedAt": "2026-08-17T07:42:30.946Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "transferNo": "string",
    "transferDate": "2026-08-17T07:42:30.946Z",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:30.946Z",
    "dispatchedAt": "2026-08-17T07:42:30.946Z",
    "receivedAt": "2026-08-17T07:42:30.946Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.946Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-transfers/{id}/reverse

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.961Z",
    "updatedAt": "2026-08-17T07:42:30.961Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "transferNo": "string",
    "transferDate": "2026-08-17T07:42:30.961Z",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "initiatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:30.961Z",
    "dispatchedAt": "2026-08-17T07:42:30.961Z",
    "receivedAt": "2026-08-17T07:42:30.961Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.961Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
stock-reservation-controller


GET
/api/inventory/stock-reservations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.975Z",
    "updatedAt": "2026-08-17T07:42:30.975Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:30.975Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.975Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/stock-reservations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:30.993Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:30.997Z",
    "updatedAt": "2026-08-17T07:42:30.997Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:30.997Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:30.997Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/stock-reservations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.013Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/stock-reservations

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:38:36.819Z",
  "createdTo": "2026-08-17T07:38:36.819Z",
  "updatedFrom": "2026-08-17T07:38:36.819Z",
  "updatedTo": "2026-08-17T07:38:36.819Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "reservationNo": "string",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "referenceType": "MANUAL",
  "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reservedQuantity": 0,
  "releasedQuantity": 0,
  "status": "string",
  "expiresAt": "2026-08-17T07:38:36.819Z"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.032Z",
      "updatedAt": "2026-08-17T07:42:31.032Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "reservationNo": "string",
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "referenceType": "MANUAL",
      "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "reservedQuantity": 0,
      "releasedQuantity": 0,
      "status": "string",
      "expiresAt": "2026-08-17T07:42:31.032Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.032Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-reservations

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:31.047Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.050Z",
    "updatedAt": "2026-08-17T07:42:31.050Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:31.050Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.050Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-reservations/{id}/release

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.059Z",
    "updatedAt": "2026-08-17T07:42:31.059Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:31.059Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.059Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-reservations/{id}/consume

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
quantity *
number
(query)
quantity
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.074Z",
    "updatedAt": "2026-08-17T07:42:31.074Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "reservationNo": "string",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reservedQuantity": 0,
    "releasedQuantity": 0,
    "status": "string",
    "expiresAt": "2026-08-17T07:42:31.074Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.074Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
stock-movement-controller


GET
/api/inventory/stock-movements/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId *
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.084Z",
    "updatedAt": "2026-08-17T07:42:31.084Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "movementNo": "string",
    "movementDate": "2026-08-17T07:42:31.084Z",
    "movementType": "string",
    "status": "string",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNumber": "string",
    "remarks": "string",
    "totalQuantity": 0,
    "totalValue": 0,
    "postedAt": "2026-08-17T07:42:31.084Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.084Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/stock-movements/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Request body

application/json
Example Value
Schema
{
  "data": {
    "movementNo": "string",
    "movementDate": "2026-08-17T07:42:31.095Z",
    "movementType": "string",
    "status": "string",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNumber": "string",
    "remarks": "string",
    "totalQuantity": 0,
    "totalValue": 0,
    "postedAt": "2026-08-17T07:42:31.095Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.098Z",
    "updatedAt": "2026-08-17T07:42:31.098Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "movementNo": "string",
    "movementDate": "2026-08-17T07:42:31.098Z",
    "movementType": "string",
    "status": "string",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNumber": "string",
    "remarks": "string",
    "totalQuantity": 0,
    "totalValue": 0,
    "postedAt": "2026-08-17T07:42:31.098Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.098Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/stock-movements/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.104Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/stock-movements

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:38:11.624Z",
  "createdTo": "2026-08-17T07:38:11.624Z",
  "updatedFrom": "2026-08-17T07:38:11.624Z",
  "updatedTo": "2026-08-17T07:38:11.624Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "movementNo": "string",
  "movementDate": "2026-08-17T07:38:11.624Z",
  "movementType": "string",
  "status": "string",
  "referenceType": "MANUAL",
  "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "referenceNumber": "string",
  "remarks": "string",
  "totalQuantity": 0,
  "totalValue": 0,
  "postedAt": "2026-08-17T07:38:11.624Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.112Z",
      "updatedAt": "2026-08-17T07:42:31.113Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "movementNo": "string",
      "movementDate": "2026-08-17T07:42:31.113Z",
      "movementType": "string",
      "status": "string",
      "referenceType": "MANUAL",
      "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "referenceNumber": "string",
      "remarks": "string",
      "totalQuantity": 0,
      "totalValue": 0,
      "postedAt": "2026-08-17T07:42:31.113Z",
      "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.113Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-movements

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "movementNo": "string",
    "movementDate": "2026-08-17T07:42:31.124Z",
    "movementType": "string",
    "status": "string",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNumber": "string",
    "remarks": "string",
    "totalQuantity": 0,
    "totalValue": 0,
    "postedAt": "2026-08-17T07:42:31.124Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.127Z",
    "updatedAt": "2026-08-17T07:42:31.127Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "movementNo": "string",
    "movementDate": "2026-08-17T07:42:31.127Z",
    "movementType": "string",
    "status": "string",
    "referenceType": "MANUAL",
    "referenceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNumber": "string",
    "remarks": "string",
    "totalQuantity": 0,
    "totalValue": 0,
    "postedAt": "2026-08-17T07:42:31.127Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reversedMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.127Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
stock-movement-line-controller


GET
/api/inventory/stock-movement-lines/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId *
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.136Z",
    "updatedAt": "2026-08-17T07:42:31.136Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "quantityBefore": 0,
    "quantityAfter": 0,
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.136Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/stock-movement-lines/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Request body

application/json
Example Value
Schema
{
  "data": {
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "quantityBefore": 0,
    "quantityAfter": 0,
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.158Z",
    "updatedAt": "2026-08-17T07:42:31.158Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "quantityBefore": 0,
    "quantityAfter": 0,
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.158Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/stock-movement-lines/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.164Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/stock-movement-lines

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:37:55.898Z",
  "createdTo": "2026-08-17T07:37:55.898Z",
  "updatedFrom": "2026-08-17T07:37:55.898Z",
  "updatedTo": "2026-08-17T07:37:55.898Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 0,
  "unitCost": 0,
  "totalCost": 0,
  "quantityBefore": 0,
  "quantityAfter": 0,
  "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.173Z",
      "updatedAt": "2026-08-17T07:42:31.173Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 0,
      "unitCost": 0,
      "totalCost": 0,
      "quantityBefore": 0,
      "quantityAfter": 0,
      "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.173Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-movement-lines

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "quantityBefore": 0,
    "quantityAfter": 0,
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.187Z",
    "updatedAt": "2026-08-17T07:42:31.187Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "quantityBefore": 0,
    "quantityAfter": 0,
    "referenceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.187Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
stock-adjustment-controller


GET
/api/inventory/stock-adjustments/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.196Z",
    "updatedAt": "2026-08-17T07:42:31.196Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "adjustmentNo": "string",
    "adjustmentDate": "2026-08-17T07:42:31.196Z",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "string",
    "remarks": "string",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.196Z",
    "lines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-08-17T07:42:31.196Z",
        "updatedAt": "2026-08-17T07:42:31.196Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true,
        "version": 9007199254740991,
        "stockAdjustmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "adjustmentType": "string",
        "quantity": 0,
        "unitCost": 0,
        "adjustmentValue": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.196Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/stock-adjustments/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "adjustmentNo": "string",
    "adjustmentDate": "2026-08-17T07:42:31.209Z",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "string",
    "remarks": "string",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.209Z",
    "lines": [
      {
        "stockAdjustmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "adjustmentType": "string",
        "quantity": 0,
        "unitCost": 0,
        "adjustmentValue": 0
      }
    ]
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.212Z",
    "updatedAt": "2026-08-17T07:42:31.212Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "adjustmentNo": "string",
    "adjustmentDate": "2026-08-17T07:42:31.212Z",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "string",
    "remarks": "string",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.212Z",
    "lines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-08-17T07:42:31.212Z",
        "updatedAt": "2026-08-17T07:42:31.212Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true,
        "version": 9007199254740991,
        "stockAdjustmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "adjustmentType": "string",
        "quantity": 0,
        "unitCost": 0,
        "adjustmentValue": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.212Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/stock-adjustments/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.221Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/stock-adjustments

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:37:37.181Z",
  "createdTo": "2026-08-17T07:37:37.181Z",
  "updatedFrom": "2026-08-17T07:37:37.181Z",
  "updatedTo": "2026-08-17T07:37:37.181Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "adjustmentNo": "string",
  "adjustmentDate": "2026-08-17T07:37:37.181Z",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "string",
  "remarks": "string",
  "status": "string",
  "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedAt": "2026-08-17T07:37:37.181Z"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.231Z",
      "updatedAt": "2026-08-17T07:42:31.231Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "adjustmentNo": "string",
      "adjustmentDate": "2026-08-17T07:42:31.231Z",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "reason": "string",
      "remarks": "string",
      "status": "string",
      "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedAt": "2026-08-17T07:42:31.231Z",
      "lines": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "createdAt": "2026-08-17T07:42:31.231Z",
          "updatedAt": "2026-08-17T07:42:31.231Z",
          "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "isDeleted": true,
          "version": 9007199254740991,
          "stockAdjustmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "adjustmentType": "string",
          "quantity": 0,
          "unitCost": 0,
          "adjustmentValue": 0
        }
      ]
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.231Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/stock-adjustments

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "adjustmentNo": "string",
    "adjustmentDate": "2026-08-17T07:42:31.243Z",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "string",
    "remarks": "string",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.243Z",
    "lines": [
      {
        "stockAdjustmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "adjustmentType": "string",
        "quantity": 0,
        "unitCost": 0,
        "adjustmentValue": 0
      }
    ]
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.246Z",
    "updatedAt": "2026-08-17T07:42:31.246Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "adjustmentNo": "string",
    "adjustmentDate": "2026-08-17T07:42:31.246Z",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "string",
    "remarks": "string",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.246Z",
    "lines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-08-17T07:42:31.246Z",
        "updatedAt": "2026-08-17T07:42:31.246Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true,
        "version": 9007199254740991,
        "stockAdjustmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "adjustmentType": "string",
        "quantity": 0,
        "unitCost": 0,
        "adjustmentValue": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.246Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
product-controller


GET
/api/inventory/products/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "product": {
      "productCode": "string",
      "sku": "string",
      "productName": "string",
      "productType": "string",
      "description": "string",
      "barcode": "string",
      "alternateBarcode": "string",
      "status": "string"
    },
    "category": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "code": "string"
    },
    "uom": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "string",
      "name": "string",
      "symbol": "string"
    },
    "hsnSac": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "string",
      "description": "string",
      "taxRate": "string"
    },
    "pricing": {
      "standardCost": 0,
      "sellingPrice": 0,
      "currency": "string"
    },
    "inventorySettings": {
      "trackingType": "string",
      "valuationMethod": "string",
      "minimumStock": 0,
      "maximumStock": 0,
      "reorderLevel": 0,
      "reorderQuantity": 0
    },
    "stockSummary": {
      "totalQuantity": 0,
      "availableQuantity": 0,
      "reservedQuantity": 0,
      "committedQuantity": 0,
      "totalStockValue": 0,
      "warehouseCount": 1073741824
    },
    "warehouses": [
      {
        "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "warehouseCode": "string",
        "warehouseName": "string",
        "location": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string",
          "addressLine1": "string",
          "addressLine2": "string",
          "city": "string",
          "state": "string",
          "country": "string",
          "postalCode": "string",
          "latitude": 0.1,
          "longitude": 0.1
        },
        "inventory": {
          "quantity": 0,
          "availableQuantity": 0,
          "reservedQuantity": 0,
          "committedQuantity": 0,
          "minimumStock": 0,
          "maximumStock": 0,
          "reorderLevel": 0,
          "reorderQuantity": 0,
          "stockValue": 0
        }
      }
    ],
    "accounting": {
      "inventoryAccount": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "code": "string",
        "name": "string"
      },
      "cogsAccount": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "code": "string",
        "name": "string"
      },
      "salesAccount": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "code": "string",
        "name": "string"
      },
      "purchaseAccount": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "code": "string",
        "name": "string"
      }
    },
    "suppliers": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string"
      }
    ],
    "recentTransactions": [
      {
        "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "transactionType": "string",
        "transactionDate": "2026-08-17T07:42:31.259Z",
        "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "warehouseName": "string",
        "quantity": 0,
        "unitCost": 0,
        "totalValue": 0,
        "referenceNumber": "string"
      }
    ],
    "metadata": {
      "createdAt": "2026-08-17T07:42:31.259Z",
      "updatedAt": "2026-08-17T07:42:31.259Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "version": 9007199254740991
    }
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.259Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/products/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "sku": "string",
    "productName": "string",
    "productType": "GOODS",
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "baseUomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "barcode": "string",
    "alternateBarcode": "string",
    "description": "string",
    "trackingType": "NONE",
    "valuationMethod": "FIFO",
    "standardCost": 0,
    "sellingPrice": 0,
    "minimumStock": 0,
    "maximumStock": 0,
    "reorderLevel": 0,
    "reorderQuantity": 0,
    "inventoryAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "cogsAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "salesAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "purchaseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "ACTIVE"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.289Z",
    "updatedAt": "2026-08-17T07:42:31.289Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productCode": "string",
    "sku": "string",
    "productName": "string",
    "productType": "GOODS",
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "baseUomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "barcode": "string",
    "alternateBarcode": "string",
    "description": "string",
    "trackingType": "NONE",
    "valuationMethod": "FIFO",
    "standardCost": 0,
    "minimumStock": 0,
    "maximumStock": 0,
    "reorderLevel": 0,
    "reorderQuantity": 0,
    "inventoryAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "cogsAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "salesAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "purchaseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "ACTIVE",
    "baseUomCode": "string",
    "sellingPrice": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.289Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/products/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.302Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/products

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:37:19.716Z",
  "createdTo": "2026-08-17T07:37:19.716Z",
  "updatedFrom": "2026-08-17T07:37:19.716Z",
  "updatedTo": "2026-08-17T07:37:19.716Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productCode": "string",
  "sku": "string",
  "productName": "string",
  "productType": "GOODS",
  "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "baseUomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "barcode": "string",
  "alternateBarcode": "string",
  "description": "string",
  "trackingType": "NONE",
  "valuationMethod": "FIFO",
  "standardCost": 0,
  "minimumStock": 0,
  "maximumStock": 0,
  "reorderLevel": 0,
  "reorderQuantity": 0,
  "inventoryAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "cogsAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "purchaseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "string"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.314Z",
      "updatedAt": "2026-08-17T07:42:31.314Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productCode": "string",
      "sku": "string",
      "productName": "string",
      "productType": "GOODS",
      "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "baseUomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "barcode": "string",
      "alternateBarcode": "string",
      "description": "string",
      "trackingType": "NONE",
      "valuationMethod": "FIFO",
      "standardCost": 0,
      "minimumStock": 0,
      "maximumStock": 0,
      "reorderLevel": 0,
      "reorderQuantity": 0,
      "inventoryAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "cogsAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "purchaseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "status": "ACTIVE",
      "baseUomCode": "string",
      "sellingPrice": 0
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.314Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/products

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "sku": "string",
    "productName": "string",
    "productType": "GOODS",
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "baseUomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "barcode": "string",
    "alternateBarcode": "string",
    "description": "string",
    "trackingType": "NONE",
    "valuationMethod": "FIFO",
    "standardCost": 0,
    "sellingPrice": 0,
    "minimumStock": 0,
    "maximumStock": 0,
    "reorderLevel": 0,
    "reorderQuantity": 0,
    "inventoryAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "cogsAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "salesAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "purchaseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "ACTIVE"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.332Z",
    "updatedAt": "2026-08-17T07:42:31.332Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productCode": "string",
    "sku": "string",
    "productName": "string",
    "productType": "GOODS",
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "baseUomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "barcode": "string",
    "alternateBarcode": "string",
    "description": "string",
    "trackingType": "NONE",
    "valuationMethod": "FIFO",
    "standardCost": 0,
    "minimumStock": 0,
    "maximumStock": 0,
    "reorderLevel": 0,
    "reorderQuantity": 0,
    "inventoryAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "cogsAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "salesAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "purchaseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "ACTIVE",
    "baseUomCode": "string",
    "sellingPrice": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.332Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
product-uom-controller


GET
/api/inventory/product-uoms/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.344Z",
    "updatedAt": "2026-08-17T07:42:31.344Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "conversionFactor": 0,
    "isPurchaseUom": true,
    "isSalesUom": true,
    "isStockUom": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.344Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/product-uoms/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "conversionFactor": 0,
    "isPurchaseUom": true,
    "isSalesUom": true,
    "isStockUom": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.361Z",
    "updatedAt": "2026-08-17T07:42:31.361Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "conversionFactor": 0,
    "isPurchaseUom": true,
    "isSalesUom": true,
    "isStockUom": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.361Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/product-uoms/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.373Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/product-uoms

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:37:09.726Z",
  "createdTo": "2026-08-17T07:37:09.726Z",
  "updatedFrom": "2026-08-17T07:37:09.726Z",
  "updatedTo": "2026-08-17T07:37:09.726Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "conversionFactor": 0,
  "isPurchaseUom": true,
  "isSalesUom": true,
  "isStockUom": true
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.388Z",
      "updatedAt": "2026-08-17T07:42:31.388Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "conversionFactor": 0,
      "isPurchaseUom": true,
      "isSalesUom": true,
      "isStockUom": true
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.388Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/product-uoms

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "conversionFactor": 0,
    "isPurchaseUom": true,
    "isSalesUom": true,
    "isStockUom": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.401Z",
    "updatedAt": "2026-08-17T07:42:31.401Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "conversionFactor": 0,
    "isPurchaseUom": true,
    "isSalesUom": true,
    "isStockUom": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.401Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
product-serial-controller


GET
/api/inventory/product-serials/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.411Z",
    "updatedAt": "2026-08-17T07:42:31.411Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialNumber": "string",
    "status": "string",
    "purchaseDate": "2026-08-17",
    "warrantyStartDate": "2026-08-17",
    "warrantyEndDate": "2026-08-17"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.411Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/product-serials/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialNumber": "string",
    "status": "string",
    "purchaseDate": "2026-08-17",
    "warrantyStartDate": "2026-08-17",
    "warrantyEndDate": "2026-08-17"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.443Z",
    "updatedAt": "2026-08-17T07:42:31.443Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialNumber": "string",
    "status": "string",
    "purchaseDate": "2026-08-17",
    "warrantyStartDate": "2026-08-17",
    "warrantyEndDate": "2026-08-17"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.443Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/product-serials/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.454Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/product-serials

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:36:50.105Z",
  "createdTo": "2026-08-17T07:36:50.105Z",
  "updatedFrom": "2026-08-17T07:36:50.105Z",
  "updatedTo": "2026-08-17T07:36:50.105Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serialNumber": "string",
  "status": "string",
  "purchaseDate": "2026-08-17",
  "warrantyStartDate": "2026-08-17",
  "warrantyEndDate": "2026-08-17"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.464Z",
      "updatedAt": "2026-08-17T07:42:31.464Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "serialNumber": "string",
      "status": "string",
      "purchaseDate": "2026-08-17",
      "warrantyStartDate": "2026-08-17",
      "warrantyEndDate": "2026-08-17"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.464Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/product-serials

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialNumber": "string",
    "status": "string",
    "purchaseDate": "2026-08-17",
    "warrantyStartDate": "2026-08-17",
    "warrantyEndDate": "2026-08-17"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.480Z",
    "updatedAt": "2026-08-17T07:42:31.480Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialNumber": "string",
    "status": "string",
    "purchaseDate": "2026-08-17",
    "warrantyStartDate": "2026-08-17",
    "warrantyEndDate": "2026-08-17"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.480Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
product-price-controller


GET
/api/inventory/product-prices/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.491Z",
    "updatedAt": "2026-08-17T07:42:31.491Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "priceType": "PURCHASE",
    "price": 0,
    "currencyCode": "string",
    "minQuantity": 0,
    "effectiveFrom": "2026-08-17T07:42:31.491Z",
    "effectiveTo": "2026-08-17T07:42:31.491Z",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.491Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/product-prices/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "priceType": "PURCHASE",
    "price": 0,
    "currencyCode": "string",
    "minQuantity": 0,
    "effectiveFrom": "2026-08-17T07:42:31.505Z",
    "effectiveTo": "2026-08-17T07:42:31.505Z",
    "status": "string"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.508Z",
    "updatedAt": "2026-08-17T07:42:31.508Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "priceType": "PURCHASE",
    "price": 0,
    "currencyCode": "string",
    "minQuantity": 0,
    "effectiveFrom": "2026-08-17T07:42:31.508Z",
    "effectiveTo": "2026-08-17T07:42:31.508Z",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.508Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/product-prices/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.517Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/product-prices

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:36:41.586Z",
  "createdTo": "2026-08-17T07:36:41.586Z",
  "updatedFrom": "2026-08-17T07:36:41.586Z",
  "updatedTo": "2026-08-17T07:36:41.586Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "priceType": "PURCHASE",
  "price": 0,
  "currencyCode": "string",
  "minQuantity": 0,
  "effectiveFrom": "2026-08-17T07:36:41.586Z",
  "effectiveTo": "2026-08-17T07:36:41.586Z",
  "status": "string"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.529Z",
      "updatedAt": "2026-08-17T07:42:31.529Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "priceType": "PURCHASE",
      "price": 0,
      "currencyCode": "string",
      "minQuantity": 0,
      "effectiveFrom": "2026-08-17T07:42:31.529Z",
      "effectiveTo": "2026-08-17T07:42:31.529Z",
      "status": "string"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.529Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/product-prices

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "priceType": "PURCHASE",
    "price": 0,
    "currencyCode": "string",
    "minQuantity": 0,
    "effectiveFrom": "2026-08-17T07:42:31.550Z",
    "effectiveTo": "2026-08-17T07:42:31.550Z",
    "status": "string"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.556Z",
    "updatedAt": "2026-08-17T07:42:31.556Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "priceType": "PURCHASE",
    "price": 0,
    "currencyCode": "string",
    "minQuantity": 0,
    "effectiveFrom": "2026-08-17T07:42:31.556Z",
    "effectiveTo": "2026-08-17T07:42:31.556Z",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.556Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
product-category-controller


GET
/api/inventory/product-categories/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.573Z",
    "updatedAt": "2026-08-17T07:42:31.573Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "code": "string",
    "name": "string",
    "description": "string",
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.573Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/product-categories/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "string",
    "description": "string",
    "isActive": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.594Z",
    "updatedAt": "2026-08-17T07:42:31.594Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "code": "string",
    "name": "string",
    "description": "string",
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.594Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/product-categories/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.606Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/product-categories

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:36:32.329Z",
  "createdTo": "2026-08-17T07:36:32.329Z",
  "updatedFrom": "2026-08-17T07:36:32.329Z",
  "updatedTo": "2026-08-17T07:36:32.329Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "code": "string",
  "name": "string",
  "description": "string",
  "isActive": true
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.621Z",
      "updatedAt": "2026-08-17T07:42:31.621Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "string",
      "name": "string",
      "description": "string",
      "isActive": true
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.621Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/product-categories

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "string",
    "description": "string",
    "isActive": true
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.636Z",
    "updatedAt": "2026-08-17T07:42:31.636Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "parentCategoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "code": "string",
    "name": "string",
    "description": "string",
    "isActive": true
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.636Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
product-batch-controller


GET
/api/inventory/product-batches/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.649Z",
    "updatedAt": "2026-08-17T07:42:31.649Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchNumber": "string",
    "manufacturingDate": "2026-08-17",
    "expiryDate": "2026-08-17",
    "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.649Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/product-batches/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchNumber": "string",
    "manufacturingDate": "2026-08-17",
    "expiryDate": "2026-08-17",
    "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.668Z",
    "updatedAt": "2026-08-17T07:42:31.668Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchNumber": "string",
    "manufacturingDate": "2026-08-17",
    "expiryDate": "2026-08-17",
    "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.668Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/product-batches/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.677Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/product-batches

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:36:24.783Z",
  "createdTo": "2026-08-17T07:36:24.783Z",
  "updatedFrom": "2026-08-17T07:36:24.783Z",
  "updatedTo": "2026-08-17T07:36:24.783Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchNumber": "string",
  "manufacturingDate": "2026-08-17",
  "expiryDate": "2026-08-17",
  "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "string"
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.692Z",
      "updatedAt": "2026-08-17T07:42:31.692Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchNumber": "string",
      "manufacturingDate": "2026-08-17",
      "expiryDate": "2026-08-17",
      "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "status": "string"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.692Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/product-batches

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchNumber": "string",
    "manufacturingDate": "2026-08-17",
    "expiryDate": "2026-08-17",
    "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.713Z",
    "updatedAt": "2026-08-17T07:42:31.713Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchNumber": "string",
    "manufacturingDate": "2026-08-17",
    "expiryDate": "2026-08-17",
    "supplierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.713Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
opening-stock-controller


GET
/api/inventory/opening-stocks/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.727Z",
    "updatedAt": "2026-08-17T07:42:31.727Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "openingStockNo": "string",
    "openingDate": "2026-08-17",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.727Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.727Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/opening-stocks/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "openingStockNo": "string",
    "openingDate": "2026-08-17",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "lines": [
      {
        "warehouseLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "quantity": 0,
        "unitCost": 0,
        "totalValue": 0,
        "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "remarks": "string",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.743Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.747Z",
    "updatedAt": "2026-08-17T07:42:31.747Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "openingStockNo": "string",
    "openingDate": "2026-08-17",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.747Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.747Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/opening-stocks/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.759Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/opening-stocks

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:36:16.318Z",
  "createdTo": "2026-08-17T07:36:16.318Z",
  "updatedFrom": "2026-08-17T07:36:16.318Z",
  "updatedTo": "2026-08-17T07:36:16.318Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "openingStockNo": "string",
  "openingDate": "2026-08-17",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "string",
  "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "remarks": "string",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedAt": "2026-08-17T07:36:16.318Z"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.772Z",
      "updatedAt": "2026-08-17T07:42:31.772Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "openingStockNo": "string",
      "openingDate": "2026-08-17",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "status": "string",
      "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "remarks": "string",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedAt": "2026-08-17T07:42:31.772Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.772Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/opening-stocks

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "openingStockNo": "string",
    "openingDate": "2026-08-17",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "lines": [
      {
        "warehouseLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "quantity": 0,
        "unitCost": 0,
        "totalValue": 0,
        "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "remarks": "string",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.786Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.791Z",
    "updatedAt": "2026-08-17T07:42:31.791Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "openingStockNo": "string",
    "openingDate": "2026-08-17",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "string",
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "remarks": "string",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-08-17T07:42:31.791Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.791Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
inventory-valuation-controller


GET
/api/inventory/inventory-valuations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.802Z",
    "updatedAt": "2026-08-17T07:42:31.802Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "averageCost": 0,
    "stockValue": 0,
    "valuationDate": "2026-08-17",
    "quantity": 0,
    "valuationMethod": "FIFO",
    "inventoryCost": 0,
    "cogsAmount": 0,
    "currencyCode": "string",
    "glPostingRequired": true,
    "glPosted": true,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.802Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/inventory-valuations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "valuationDate": "2026-08-17"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.829Z",
    "updatedAt": "2026-08-17T07:42:31.829Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "averageCost": 0,
    "stockValue": 0,
    "valuationDate": "2026-08-17",
    "quantity": 0,
    "valuationMethod": "FIFO",
    "inventoryCost": 0,
    "cogsAmount": 0,
    "currencyCode": "string",
    "glPostingRequired": true,
    "glPosted": true,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.829Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/inventory-valuations/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.840Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/inventory-valuations

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:35:17.101Z",
  "createdTo": "2026-08-17T07:35:17.101Z",
  "updatedFrom": "2026-08-17T07:35:17.101Z",
  "updatedTo": "2026-08-17T07:35:17.101Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "valuationDate": "2026-08-17",
  "quantity": 0,
  "valuationMethod": "FIFO",
  "inventoryCost": 0,
  "cogsAmount": 0,
  "currencyCode": "string",
  "glPostingRequired": true,
  "glPosted": true,
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.854Z",
      "updatedAt": "2026-08-17T07:42:31.854Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "averageCost": 0,
      "stockValue": 0,
      "valuationDate": "2026-08-17",
      "quantity": 0,
      "valuationMethod": "FIFO",
      "inventoryCost": 0,
      "cogsAmount": 0,
      "currencyCode": "string",
      "glPostingRequired": true,
      "glPosted": true,
      "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.854Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/inventory-valuations

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "valuationDate": "2026-08-17"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.869Z",
    "updatedAt": "2026-08-17T07:42:31.869Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "stockMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "averageCost": 0,
    "stockValue": 0,
    "valuationDate": "2026-08-17",
    "quantity": 0,
    "valuationMethod": "FIFO",
    "inventoryCost": 0,
    "cogsAmount": 0,
    "currencyCode": "string",
    "glPostingRequired": true,
    "glPosted": true,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.869Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
inventory-stock-controller


GET
/api/inventory/inventory-stocks/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId *
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.880Z",
    "updatedAt": "2026-08-17T07:42:31.880Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productName": "string",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseName": "string",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationName": "string",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchCode": "string",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0,
    "lastMovementAt": "2026-08-17T07:42:31.880Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.880Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/inventory-stocks/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId *
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0,
    "lastMovementAt": "2026-08-17T07:42:31.899Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.903Z",
    "updatedAt": "2026-08-17T07:42:31.903Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productName": "string",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseName": "string",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationName": "string",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchCode": "string",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0,
    "lastMovementAt": "2026-08-17T07:42:31.903Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.903Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/inventory-stocks/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId *
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.913Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/inventory-stocks

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:35:08.410Z",
  "createdTo": "2026-08-17T07:35:08.410Z",
  "updatedFrom": "2026-08-17T07:35:08.410Z",
  "updatedTo": "2026-08-17T07:35:08.410Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 0,
  "reservedQuantity": 0,
  "availableQuantity": 0,
  "averageCost": 0,
  "stockValue": 0,
  "lastMovementAt": "2026-08-17T07:35:08.410Z"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.923Z",
      "updatedAt": "2026-08-17T07:42:31.923Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "productName": "string",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "warehouseName": "string",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationName": "string",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchCode": "string",
      "quantity": 0,
      "reservedQuantity": 0,
      "availableQuantity": 0,
      "averageCost": 0,
      "stockValue": 0,
      "lastMovementAt": "2026-08-17T07:42:31.923Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.923Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/inventory-stocks

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0,
    "lastMovementAt": "2026-08-17T07:42:31.936Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.939Z",
    "updatedAt": "2026-08-17T07:42:31.939Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productName": "string",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseName": "string",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationName": "string",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchCode": "string",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0,
    "lastMovementAt": "2026-08-17T07:42:31.939Z"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.939Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
inventory-snapshot-controller


GET
/api/inventory/inventory-snapshots/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.948Z",
    "updatedAt": "2026-08-17T07:42:31.948Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "snapshotScope": "string",
    "snapshotDate": "2026-08-17T07:42:31.948Z",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.948Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/inventory-snapshots/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "snapshotScope": "string",
    "snapshotDate": "2026-08-17T07:42:31.963Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:31.966Z",
    "updatedAt": "2026-08-17T07:42:31.966Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "snapshotScope": "string",
    "snapshotDate": "2026-08-17T07:42:31.966Z",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "reservedQuantity": 0,
    "availableQuantity": 0,
    "averageCost": 0,
    "stockValue": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.966Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/inventory-snapshots/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.977Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/inventory-snapshots

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:35:02.731Z",
  "createdTo": "2026-08-17T07:35:02.731Z",
  "updatedFrom": "2026-08-17T07:35:02.731Z",
  "updatedTo": "2026-08-17T07:35:02.731Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "snapshotScope": "string",
  "snapshotDateFrom": "2026-08-17T07:35:02.731Z",
  "snapshotDateTo": "2026-08-17T07:35:02.731Z",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:31.992Z",
      "updatedAt": "2026-08-17T07:42:31.992Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "snapshotScope": "string",
      "snapshotDate": "2026-08-17T07:42:31.992Z",
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 0,
      "reservedQuantity": 0,
      "availableQuantity": 0,
      "averageCost": 0,
      "stockValue": 0
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:31.992Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/inventory-snapshots

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "snapshotScope": "string",
    "snapshotDate": "2026-08-17T07:42:32.007Z"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:32.011Z",
      "updatedAt": "2026-08-17T07:42:32.011Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "snapshotScope": "string",
      "snapshotDate": "2026-08-17T07:42:32.011Z",
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 0,
      "reservedQuantity": 0,
      "availableQuantity": 0,
      "averageCost": 0,
      "stockValue": 0
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.011Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
inventory-period-controller


GET
/api/inventory/inventory-periods/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.023Z",
    "updatedAt": "2026-08-17T07:42:32.023Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "periodName": "string",
    "startDate": "2026-08-17",
    "endDate": "2026-08-17",
    "status": "string",
    "closedAt": "2026-08-17T07:42:32.023Z",
    "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.023Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/inventory-periods/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "periodName": "string",
    "startDate": "2026-08-17",
    "endDate": "2026-08-17",
    "status": "string",
    "closedAt": "2026-08-17T07:42:32.041Z",
    "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.043Z",
    "updatedAt": "2026-08-17T07:42:32.043Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "periodName": "string",
    "startDate": "2026-08-17",
    "endDate": "2026-08-17",
    "status": "string",
    "closedAt": "2026-08-17T07:42:32.043Z",
    "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.043Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/inventory-periods/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.055Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/inventory-periods

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:34:56.266Z",
  "createdTo": "2026-08-17T07:34:56.266Z",
  "updatedFrom": "2026-08-17T07:34:56.266Z",
  "updatedTo": "2026-08-17T07:34:56.266Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "periodName": "string",
  "startDate": "2026-08-17",
  "endDate": "2026-08-17",
  "status": "string",
  "closedAt": "2026-08-17T07:34:56.266Z",
  "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:32.070Z",
      "updatedAt": "2026-08-17T07:42:32.070Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "periodName": "string",
      "startDate": "2026-08-17",
      "endDate": "2026-08-17",
      "status": "string",
      "closedAt": "2026-08-17T07:42:32.070Z",
      "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.070Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/inventory-periods

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "periodName": "string",
    "startDate": "2026-08-17",
    "endDate": "2026-08-17",
    "status": "string",
    "closedAt": "2026-08-17T07:42:32.088Z",
    "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.092Z",
    "updatedAt": "2026-08-17T07:42:32.092Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "periodName": "string",
    "startDate": "2026-08-17",
    "endDate": "2026-08-17",
    "status": "string",
    "closedAt": "2026-08-17T07:42:32.092Z",
    "closedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.092Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
inventory-cost-layer-controller


GET
/api/inventory/inventory-cost-layers/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.104Z",
    "updatedAt": "2026-08-17T07:42:32.104Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivedQuantity": 0,
    "remainingQuantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "consumedCost": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.104Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

PUT
/api/inventory/inventory-cost-layers/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivedQuantity": 0,
    "remainingQuantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "consumedCost": 0
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.121Z",
    "updatedAt": "2026-08-17T07:42:32.121Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivedQuantity": 0,
    "remainingQuantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "consumedCost": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.121Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

DELETE
/api/inventory/inventory-cost-layers/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.129Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/inventory-cost-layers

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:34:44.141Z",
  "createdTo": "2026-08-17T07:34:44.141Z",
  "updatedFrom": "2026-08-17T07:34:44.141Z",
  "updatedTo": "2026-08-17T07:34:44.141Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivedQuantity": 0,
  "remainingQuantity": 0,
  "unitCost": 0,
  "totalCost": 0,
  "consumedCost": 0
}
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:32.141Z",
      "updatedAt": "2026-08-17T07:42:32.141Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "receivedQuantity": 0,
      "remainingQuantity": 0,
      "unitCost": 0,
      "totalCost": 0,
      "consumedCost": 0
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.141Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

POST
/api/inventory/inventory-cost-layers

Parameters
Try it out
Name	Description
companyId
string($uuid)
(query)
companyId
Request body

application/json
Example Value
Schema
{
  "data": {
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivedQuantity": 0,
    "remainingQuantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "consumedCost": 0
  }
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.155Z",
    "updatedAt": "2026-08-17T07:42:32.155Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sourceMovementLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivedQuantity": 0,
    "remainingQuantity": 0,
    "unitCost": 0,
    "totalCost": 0,
    "consumedCost": 0
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.155Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
sales-invoice-integration-controller


POST
/api/inventory/integration/sales-invoice/stock-out

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceNumber": "string",
  "invoiceDate": "2026-08-17",
  "movementType": "string",
  "items": [
    {
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 1,
      "unit": "string",
      "unitPrice": 0,
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "locationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "inventoryTransactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "movementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "movementType": "string",
    "totalQuantity": 0,
    "totalValue": 0,
    "status": "string"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.175Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
auth-controller


POST
/api/inventory/auth/refresh

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

No links

POST
/api/inventory/auth/logout

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string"
}
No links

GET
/api/inventory/auth/verify

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "valid": true,
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyCode": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-08-17T07:42:32.184Z",
    "updatedAt": "2026-08-17T07:42:32.184Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-08-17T07:42:32.184Z",
        "updatedAt": "2026-08-17T07:42:32.184Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-08-17T07:42:32.184Z",
        "updatedAt": "2026-08-17T07:42:32.184Z"
      }
    ],
    "session": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "ipAddress": "string",
        "userAgent": "string",
        "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "moduleName": "string",
        "createdAt": "2026-08-17T07:42:32.184Z",
        "updatedAt": "2026-08-17T07:42:32.184Z",
        "accessTokenValidTill": "2026-08-17T07:42:32.184Z"
      }
    ]
  }
}
No links

GET
/api/inventory/auth/validate

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": true,
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.188Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/auth/me

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyCode": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-08-17T07:42:32.193Z",
    "updatedAt": "2026-08-17T07:42:32.193Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-08-17T07:42:32.193Z",
        "updatedAt": "2026-08-17T07:42:32.193Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-08-17T07:42:32.193Z",
        "updatedAt": "2026-08-17T07:42:32.193Z"
      }
    ],
    "session": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "ipAddress": "string",
        "userAgent": "string",
        "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "moduleName": "string",
        "createdAt": "2026-08-17T07:42:32.193Z",
        "updatedAt": "2026-08-17T07:42:32.193Z",
        "accessTokenValidTill": "2026-08-17T07:42:32.193Z"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.193Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/auth/login

Parameters
Try it out
Name	Description
companyCode *
string
(query)
companyCode
Responses
Code	Description	Links
200	
OK

No links

GET
/api/inventory/auth/callback

Parameters
Try it out
Name	Description
code
string
(query)
code
Responses
Code	Description	Links
200	
OK

No links
stock-transfer-line-controller


GET
/api/inventory/stock-transfer-lines

Parameters
Try it out
Name	Description
filter *
object
(query)
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "createdFrom": "2026-08-17T07:34:30.005Z",
  "createdTo": "2026-08-17T07:34:30.005Z",
  "updatedFrom": "2026-08-17T07:34:30.005Z",
  "updatedTo": "2026-08-17T07:34:30.005Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "stockTransferId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 0,
  "unitCost": 0
}
companyId
string($uuid)
(query)
companyId
pageable *
object
(query)
{
  "page": 1073741824,
  "size": 1073741824,
  "sort": [
    "string"
  ]
}
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-08-17T07:42:32.213Z",
      "updatedAt": "2026-08-17T07:42:32.213Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "isDeleted": true,
      "version": 9007199254740991,
      "stockTransferId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 0,
      "unitCost": 0,
      "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.213Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links

GET
/api/inventory/stock-transfer-lines/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-08-17T07:42:32.223Z",
    "updatedAt": "2026-08-17T07:42:32.223Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true,
    "version": 9007199254740991,
    "stockTransferId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "quantity": 0,
    "unitCost": 0,
    "sourceLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationLocationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 1073741824,
  "timestamp": "2026-08-17T07:42:32.223Z",
  "pagination": {
    "page": 1073741824,
    "size": 1073741824,
    "totalElements": 9007199254740991,
    "totalPages": 1073741824,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  }
}
No links
inventory-dashboard-controller


GET
/api/inventory/dashboard

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(query)
companyId
role
string
(query)
Default value : EMPLOYEE

EMPLOYEE
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "role": "string",
  "summary": {
    "additionalProp1": {},
    "additionalProp2": {},
    "additionalProp3": {}
  },
  "metrics": [
    {
      "label": "string",
      "value": {},
      "type": "string",
      "icon": "string"
    }
  ],
  "alerts": [
    {
      "label": "string",
      "value": {},
      "type": "string",
      "icon": "string"
    }
  ]
}
No links