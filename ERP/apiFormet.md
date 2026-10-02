Customer Management
Manage customer master data



GET
/api/account/customers/{id}
Get customer by ID

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerCode": "string",
    "customerName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "creditLimit": 0,
    "isActive": true,
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalReceipts": 0,
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T12:56:20.249Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T12:56:20.249Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.249Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/customers/{id}
Update an existing customer

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
    "customerCode": "string",
    "customerName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "user@example.com",
    "phone": "",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "creditLimit": 0,
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
    "companyName": "string",
    "customerCode": "string",
    "customerName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "creditLimit": 0,
    "isActive": true,
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalReceipts": 0,
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T12:56:20.255Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T12:56:20.255Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.255Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/customers/{id}
Delete a customer (soft delete)

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.259Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/customers
Get customers with optional filters and pagination

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "customerCode": "string",
  "customerName": "string",
  "email": "string",
  "phone": "string",
  "gstin": "string",
  "pan": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "minCreditLimit": 0,
  "maxCreditLimit": 0,
  "isActive": true,
  "createdFrom": "2026-07-16T12:56:16.169Z",
  "createdTo": "2026-07-16T12:56:16.169Z",
  "updatedFrom": "2026-07-16T12:56:16.169Z",
  "updatedTo": "2026-07-16T12:56:16.169Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
      "companyName": "string",
      "customerCode": "string",
      "customerName": "string",
      "gstin": "string",
      "panNo": "string",
      "email": "string",
      "phone": "string",
      "addressLine1": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "creditLimit": 0,
      "isActive": true,
      "outstandingBalance": 0,
      "availableCredit": 0,
      "totalInvoices": 0,
      "totalReceipts": 0,
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-07-16T12:56:20.262Z",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedAt": "2026-07-16T12:56:20.262Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.262Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/customers
Create a new customer

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "customerCode": "string",
    "customerName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "user@example.com",
    "phone": "",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "creditLimit": 0,
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
    "companyName": "string",
    "customerCode": "string",
    "customerName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "creditLimit": 0,
    "isActive": true,
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalReceipts": 0,
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T12:56:20.266Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T12:56:20.266Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.266Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/account/customers/{id}/deactivate
Deactivate a customer

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.270Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/account/customers/{id}/activate
Activate a customer

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.272Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/customers/{id}/transactions
Get customer transactions for a date range

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
fromDate *
string($date)
(query)
fromDate
toDate *
string($date)
(query)
toDate
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
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "fromDate": "2026-07-16",
    "toDate": "2026-07-16",
    "openingBalance": 0,
    "invoiceAmount": 0,
    "receiptAmount": 0,
    "closingBalance": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.276Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/customers/{id}/ledger
Get customer ledger for a date range

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
fromDate *
string($date)
(query)
fromDate
toDate *
string($date)
(query)
toDate
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
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "fromDate": "2026-07-16",
    "toDate": "2026-07-16",
    "openingBalance": 0,
    "invoiceAmount": 0,
    "receiptAmount": 0,
    "closingBalance": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T12:56:20.279Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links dont send unnesry data implement these apies and filters which are missing


Sales Invoices
Sales Invoice Management APIs



GET
/api/account/sales/invoices/{invoiceId}
Get invoice by ID


Retrieves a single invoice with complete details

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.386Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.386Z",
    "updatedAt": "2026-07-16T14:14:39.386Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.386Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/sales/invoices/{invoiceId}
Update sales invoice


Updates an existing DRAFT sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
Request body

application/json
Example Value
Schema
{
  "data": {
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "INV-2026-001",
    "invoiceDate": "2026-05-26",
    "dueDate": "2026-06-25",
    "invoiceCurrency": "INR",
    "exchangeRate": 1,
    "subtotal": 1000,
    "taxAmount": 180,
    "totalAmount": 1180,
    "receivedAmount": 0,
    "placeOfSupply": "MH",
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 10,
        "unitPrice": 100,
        "taxableAmount": 1000,
        "taxAmount": 180,
        "cgstAmount": 90,
        "sgstAmount": 90,
        "igstAmount": 0,
        "cessAmount": 0,
        "notes": "string",
        "unit": "PCS",
        "validTaxableAmount": true
      }
    ],
    "notes": "string",
    "validReceivedAmount": true,
    "validLineItemsTotal": true,
    "validTotal": true,
    "validDueDate": true
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.395Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.395Z",
    "updatedAt": "2026-07-16T14:14:39.395Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.395Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/sales/invoices/{invoiceId}
Delete sales invoice


Soft-deletes a DRAFT sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.399Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices
Get all invoices


Retrieves all invoices for a company with pagination and advanced filtering

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceNumber": "string",
  "statuses": [
    "DRAFT"
  ],
  "postingStatuses": [
    "DRAFT"
  ],
  "invoiceCurrency": "string",
  "minTotalAmount": 0,
  "maxTotalAmount": 0,
  "minOutstandingAmount": 0,
  "maxOutstandingAmount": 0,
  "invoiceDateFrom": "2026-07-16",
  "invoiceDateTo": "2026-07-16",
  "dueDateFrom": "2026-07-16",
  "dueDateTo": "2026-07-16",
  "isOverdue": true,
  "hasOutstandingBalance": true,
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
sort
string
(query)
Default value : invoiceDate,desc

invoiceDate,desc
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
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNumber": "string",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "companyGstin": "string",
        "companyBaseCurrency": "string",
        "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerCode": "string",
        "customerName": "string",
        "customerGstin": "string",
        "customerEmail": "string",
        "customerPhone": "string",
        "customerAddress": "string",
        "customerCity": "string",
        "customerState": "string",
        "customerCountry": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "receivedAmount": 0,
        "outstandingAmount": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyAmount": 0,
        "placeOfSupply": "string",
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "taxRate": 0,
        "lineItems": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "hsnSacCode": "string",
            "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemName": "string",
            "description": "string",
            "quantity": 0,
            "unit": "string",
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "taxRate": 0,
            "cgstPercentage": 0,
            "sgstPercentage": 0,
            "igstPercentage": 0,
            "cgstAmount": 0,
            "sgstAmount": 0,
            "igstAmount": 0,
            "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "discountPercentage": 0,
            "discountAmount": 0,
            "discountedAmount": 0,
            "batchNumber": "string",
            "serialNumber": "string",
            "expiryDate": "string",
            "costCenter": "string",
            "lineNumber": 0,
            "remarks": "string"
          }
        ],
        "itemCount": 0,
        "status": "DRAFT",
        "glPostingStatus": "DRAFT",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approverName": "string",
        "approvedAt": "2026-07-16T14:14:39.403Z",
        "approvalNotes": "string",
        "paymentStatus": "string",
        "paymentPercentage": 0,
        "lastPaymentDate": "2026-07-16",
        "createdAt": "2026-07-16T14:14:39.403Z",
        "updatedAt": "2026-07-16T14:14:39.403Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdByName": "string",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedByName": "string",
        "taxTransactionCount": 0,
        "paymentCount": 0,
        "creditNoteCount": 0,
        "isDeleted": true,
        "remarks": "string",
        "referenceNumber": "string",
        "businessDescription": "string",
        "agingBucket": "string",
        "daysOutstanding": 0,
        "isOverdue": true,
        "interestAccrued": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "pageSize": 0,
      "paged": true,
      "pageNumber": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.403Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices
Create new sales invoice


Creates a new sales invoice in DRAFT status

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "INV-2026-001",
    "invoiceDate": "2026-05-26",
    "dueDate": "2026-06-25",
    "invoiceCurrency": "INR",
    "exchangeRate": 1,
    "subtotal": 1000,
    "taxAmount": 180,
    "totalAmount": 1180,
    "receivedAmount": 0,
    "placeOfSupply": "MH",
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 10,
        "unitPrice": 100,
        "taxableAmount": 1000,
        "taxAmount": 180,
        "cgstAmount": 90,
        "sgstAmount": 90,
        "igstAmount": 0,
        "cessAmount": 0,
        "notes": "string",
        "unit": "PCS",
        "validTaxableAmount": true
      }
    ],
    "notes": "string",
    "validReceivedAmount": true,
    "validLineItemsTotal": true,
    "validTotal": true,
    "validDueDate": true
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.408Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.408Z",
    "updatedAt": "2026-07-16T14:14:39.408Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.408Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices/{invoiceId}/reject
Reject invoice


Rejects a DRAFT or PENDING_APPROVAL invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.412Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.412Z",
    "updatedAt": "2026-07-16T14:14:39.412Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.412Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices/{invoiceId}/post
Post invoice to GL


Posts an APPROVED invoice to General Ledger (creates GL journal entry)

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.416Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.416Z",
    "updatedAt": "2026-07-16T14:14:39.416Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.416Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices/{invoiceId}/partial-payment
Record partial payment


Records a partial payment against an invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
paymentAmount *
number
(query)
paymentAmount
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.421Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.421Z",
    "updatedAt": "2026-07-16T14:14:39.421Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.421Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices/{invoiceId}/mark-paid
Mark invoice as paid


Marks an invoice as fully PAID

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
paymentAmount *
number
(query)
paymentAmount
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.425Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.425Z",
    "updatedAt": "2026-07-16T14:14:39.425Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.425Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices/{invoiceId}/cancel
Cancel invoice


Cancels an invoice (reverses GL posting if already posted)

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.429Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.429Z",
    "updatedAt": "2026-07-16T14:14:39.429Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.429Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/sales/invoices/{invoiceId}/approve
Approve invoice


Approves a DRAFT invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.433Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.433Z",
    "updatedAt": "2026-07-16T14:14:39.433Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.433Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/status/{status}
Get invoices by status


Retrieves invoices filtered by status

Parameters
Try it out
Name	Description
status *
string
(path)
Available values : DRAFT, PENDING_APPROVAL, APPROVED, POSTED, PARTIALLY_PAID, PAID, CANCELLED, REJECTED


DRAFT
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNumber": "string",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "companyGstin": "string",
        "companyBaseCurrency": "string",
        "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerCode": "string",
        "customerName": "string",
        "customerGstin": "string",
        "customerEmail": "string",
        "customerPhone": "string",
        "customerAddress": "string",
        "customerCity": "string",
        "customerState": "string",
        "customerCountry": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "receivedAmount": 0,
        "outstandingAmount": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyAmount": 0,
        "placeOfSupply": "string",
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "taxRate": 0,
        "lineItems": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "hsnSacCode": "string",
            "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemName": "string",
            "description": "string",
            "quantity": 0,
            "unit": "string",
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "taxRate": 0,
            "cgstPercentage": 0,
            "sgstPercentage": 0,
            "igstPercentage": 0,
            "cgstAmount": 0,
            "sgstAmount": 0,
            "igstAmount": 0,
            "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "discountPercentage": 0,
            "discountAmount": 0,
            "discountedAmount": 0,
            "batchNumber": "string",
            "serialNumber": "string",
            "expiryDate": "string",
            "costCenter": "string",
            "lineNumber": 0,
            "remarks": "string"
          }
        ],
        "itemCount": 0,
        "status": "DRAFT",
        "glPostingStatus": "DRAFT",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approverName": "string",
        "approvedAt": "2026-07-16T14:14:39.442Z",
        "approvalNotes": "string",
        "paymentStatus": "string",
        "paymentPercentage": 0,
        "lastPaymentDate": "2026-07-16",
        "createdAt": "2026-07-16T14:14:39.442Z",
        "updatedAt": "2026-07-16T14:14:39.442Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdByName": "string",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedByName": "string",
        "taxTransactionCount": 0,
        "paymentCount": 0,
        "creditNoteCount": 0,
        "isDeleted": true,
        "remarks": "string",
        "referenceNumber": "string",
        "businessDescription": "string",
        "agingBucket": "string",
        "daysOutstanding": 0,
        "isOverdue": true,
        "interestAccrued": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "pageSize": 0,
      "paged": true,
      "pageNumber": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.442Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/reports/summary
Get sales summary


Retrieves summary statistics for all invoices

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
    "totalInvoices": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "overdueAmount": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.447Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/reports/customer/{customerId}/summary
Get customer sales summary


Retrieves summary for specific customer

Parameters
Try it out
Name	Description
customerId *
string($uuid)
(path)
customerId
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
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "totalInvoices": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "overdueAmount": 0,
    "creditLimit": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.449Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/overdue
Get overdue invoices


Retrieves invoices past due date with pending payment

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
asOfDate
string($date)
(query)
asOfDate
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
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNumber": "string",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "companyGstin": "string",
        "companyBaseCurrency": "string",
        "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerCode": "string",
        "customerName": "string",
        "customerGstin": "string",
        "customerEmail": "string",
        "customerPhone": "string",
        "customerAddress": "string",
        "customerCity": "string",
        "customerState": "string",
        "customerCountry": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "receivedAmount": 0,
        "outstandingAmount": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyAmount": 0,
        "placeOfSupply": "string",
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "taxRate": 0,
        "lineItems": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "hsnSacCode": "string",
            "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemName": "string",
            "description": "string",
            "quantity": 0,
            "unit": "string",
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "taxRate": 0,
            "cgstPercentage": 0,
            "sgstPercentage": 0,
            "igstPercentage": 0,
            "cgstAmount": 0,
            "sgstAmount": 0,
            "igstAmount": 0,
            "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "discountPercentage": 0,
            "discountAmount": 0,
            "discountedAmount": 0,
            "batchNumber": "string",
            "serialNumber": "string",
            "expiryDate": "string",
            "costCenter": "string",
            "lineNumber": 0,
            "remarks": "string"
          }
        ],
        "itemCount": 0,
        "status": "DRAFT",
        "glPostingStatus": "DRAFT",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approverName": "string",
        "approvedAt": "2026-07-16T14:14:39.452Z",
        "approvalNotes": "string",
        "paymentStatus": "string",
        "paymentPercentage": 0,
        "lastPaymentDate": "2026-07-16",
        "createdAt": "2026-07-16T14:14:39.452Z",
        "updatedAt": "2026-07-16T14:14:39.452Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdByName": "string",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedByName": "string",
        "taxTransactionCount": 0,
        "paymentCount": 0,
        "creditNoteCount": 0,
        "isDeleted": true,
        "remarks": "string",
        "referenceNumber": "string",
        "businessDescription": "string",
        "agingBucket": "string",
        "daysOutstanding": 0,
        "isOverdue": true,
        "interestAccrued": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "pageSize": 0,
      "paged": true,
      "pageNumber": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.452Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/outstanding
Get outstanding invoices


Retrieves invoices with pending payment

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNumber": "string",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "companyGstin": "string",
        "companyBaseCurrency": "string",
        "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerCode": "string",
        "customerName": "string",
        "customerGstin": "string",
        "customerEmail": "string",
        "customerPhone": "string",
        "customerAddress": "string",
        "customerCity": "string",
        "customerState": "string",
        "customerCountry": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "receivedAmount": 0,
        "outstandingAmount": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyAmount": 0,
        "placeOfSupply": "string",
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "taxRate": 0,
        "lineItems": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "hsnSacCode": "string",
            "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemName": "string",
            "description": "string",
            "quantity": 0,
            "unit": "string",
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "taxRate": 0,
            "cgstPercentage": 0,
            "sgstPercentage": 0,
            "igstPercentage": 0,
            "cgstAmount": 0,
            "sgstAmount": 0,
            "igstAmount": 0,
            "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "discountPercentage": 0,
            "discountAmount": 0,
            "discountedAmount": 0,
            "batchNumber": "string",
            "serialNumber": "string",
            "expiryDate": "string",
            "costCenter": "string",
            "lineNumber": 0,
            "remarks": "string"
          }
        ],
        "itemCount": 0,
        "status": "DRAFT",
        "glPostingStatus": "DRAFT",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approverName": "string",
        "approvedAt": "2026-07-16T14:14:39.459Z",
        "approvalNotes": "string",
        "paymentStatus": "string",
        "paymentPercentage": 0,
        "lastPaymentDate": "2026-07-16",
        "createdAt": "2026-07-16T14:14:39.459Z",
        "updatedAt": "2026-07-16T14:14:39.459Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdByName": "string",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedByName": "string",
        "taxTransactionCount": 0,
        "paymentCount": 0,
        "creditNoteCount": 0,
        "isDeleted": true,
        "remarks": "string",
        "referenceNumber": "string",
        "businessDescription": "string",
        "agingBucket": "string",
        "daysOutstanding": 0,
        "isOverdue": true,
        "interestAccrued": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "pageSize": 0,
      "paged": true,
      "pageNumber": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.459Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/number/{invoiceNumber}
Get invoice by number


Retrieves an invoice by invoice number

Parameters
Try it out
Name	Description
invoiceNumber *
string
(path)
invoiceNumber
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
    "invoiceNumber": "string",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "companyGstin": "string",
    "companyBaseCurrency": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "customerGstin": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "customerCity": "string",
    "customerState": "string",
    "customerCountry": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyAmount": 0,
    "placeOfSupply": "string",
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "taxRate": 0,
    "lineItems": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "hsnSacCode": "string",
        "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unit": "string",
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "taxRate": 0,
        "cgstPercentage": 0,
        "sgstPercentage": 0,
        "igstPercentage": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "discountPercentage": 0,
        "discountAmount": 0,
        "discountedAmount": 0,
        "batchNumber": "string",
        "serialNumber": "string",
        "expiryDate": "string",
        "costCenter": "string",
        "lineNumber": 0,
        "remarks": "string"
      }
    ],
    "itemCount": 0,
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approverName": "string",
    "approvedAt": "2026-07-16T14:14:39.465Z",
    "approvalNotes": "string",
    "paymentStatus": "string",
    "paymentPercentage": 0,
    "lastPaymentDate": "2026-07-16",
    "createdAt": "2026-07-16T14:14:39.465Z",
    "updatedAt": "2026-07-16T14:14:39.465Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdByName": "string",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedByName": "string",
    "taxTransactionCount": 0,
    "paymentCount": 0,
    "creditNoteCount": 0,
    "isDeleted": true,
    "remarks": "string",
    "referenceNumber": "string",
    "businessDescription": "string",
    "agingBucket": "string",
    "daysOutstanding": 0,
    "isOverdue": true,
    "interestAccrued": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.465Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/customer/{customerId}
Get customer invoices


Retrieves all invoices for a specific customer

Parameters
Try it out
Name	Description
customerId *
string($uuid)
(path)
customerId
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNumber": "string",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "companyGstin": "string",
        "companyBaseCurrency": "string",
        "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerCode": "string",
        "customerName": "string",
        "customerGstin": "string",
        "customerEmail": "string",
        "customerPhone": "string",
        "customerAddress": "string",
        "customerCity": "string",
        "customerState": "string",
        "customerCountry": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "receivedAmount": 0,
        "outstandingAmount": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyAmount": 0,
        "placeOfSupply": "string",
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "taxRate": 0,
        "lineItems": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "hsnSacCode": "string",
            "hsnSacId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemName": "string",
            "description": "string",
            "quantity": 0,
            "unit": "string",
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "taxRate": 0,
            "cgstPercentage": 0,
            "sgstPercentage": 0,
            "igstPercentage": 0,
            "cgstAmount": 0,
            "sgstAmount": 0,
            "igstAmount": 0,
            "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "discountPercentage": 0,
            "discountAmount": 0,
            "discountedAmount": 0,
            "batchNumber": "string",
            "serialNumber": "string",
            "expiryDate": "string",
            "costCenter": "string",
            "lineNumber": 0,
            "remarks": "string"
          }
        ],
        "itemCount": 0,
        "status": "DRAFT",
        "glPostingStatus": "DRAFT",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approverName": "string",
        "approvedAt": "2026-07-16T14:14:39.470Z",
        "approvalNotes": "string",
        "paymentStatus": "string",
        "paymentPercentage": 0,
        "lastPaymentDate": "2026-07-16",
        "createdAt": "2026-07-16T14:14:39.470Z",
        "updatedAt": "2026-07-16T14:14:39.470Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdByName": "string",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedByName": "string",
        "taxTransactionCount": 0,
        "paymentCount": 0,
        "creditNoteCount": 0,
        "isDeleted": true,
        "remarks": "string",
        "referenceNumber": "string",
        "businessDescription": "string",
        "agingBucket": "string",
        "daysOutstanding": 0,
        "isOverdue": true,
        "interestAccrued": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "pageSize": 0,
      "paged": true,
      "pageNumber": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.470Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/customer/{customerId}/outstanding-balance
Get customer outstanding balance


Retrieves total outstanding amount for customer

Parameters
Try it out
Name	Description
customerId *
string($uuid)
(path)
customerId
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
  "data": 0,
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.474Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/sales/invoices/aging
Get invoice aging report


Retrieves aging analysis of outstanding invoices

Parameters
Try it out
Name	Description
asOfDate
string($date)
(query)
asOfDate
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
    "amount0to30Days": 0,
    "amount31to60Days": 0,
    "amount61to90Days": 0,
    "amount90PlusDays": 0,
    "count0to30Days": 0,
    "count31to60Days": 0,
    "count61to90Days": 0,
    "count90PlusDays": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:14:39.476Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
Chart of Accounts
Chart of account management APIs



GET
/api/account/chart-of-accounts/{id}
Get chart of account


Retrieve a single chart of account by id

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
Account retrieved successfully

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
    "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "groupName": "string",
    "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentAccountCode": "string",
    "accountCode": "string",
    "accountName": "string",
    "accountType": "DEBIT",
    "postingAllowed": true,
    "isActive": true,
    "openingBalance": 0,
    "deleted": true,
    "createdAt": "2026-07-16T14:19:04.062Z",
    "updatedAt": "2026-07-16T14:19:04.062Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.062Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
403	
Access denied or company mismatch

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "groupName": "string",
    "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentAccountCode": "string",
    "accountCode": "string",
    "accountName": "string",
    "accountType": "DEBIT",
    "postingAllowed": true,
    "isActive": true,
    "openingBalance": 0,
    "deleted": true,
    "createdAt": "2026-07-16T14:19:04.065Z",
    "updatedAt": "2026-07-16T14:19:04.065Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.065Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Chart of account not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "groupName": "string",
    "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentAccountCode": "string",
    "accountCode": "string",
    "accountName": "string",
    "accountType": "DEBIT",
    "postingAllowed": true,
    "isActive": true,
    "openingBalance": 0,
    "deleted": true,
    "createdAt": "2026-07-16T14:19:04.067Z",
    "updatedAt": "2026-07-16T14:19:04.067Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.067Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/chart-of-accounts/{id}
Update chart of account


Update a chart of account for the current tenant company

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
    "accountCode": "string",
    "accountName": "string",
    "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountType": "DEBIT",
    "postingAllowed": true,
    "isActive": true,
    "openingBalance": 0
  }
}
Responses
Code	Description	Links
200	
Account updated successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.070Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
400	
Invalid request payload

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.071Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
403	
Access denied or company mismatch

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.072Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Chart of account not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.073Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/chart-of-accounts/{id}
Delete chart of account


Soft delete a chart of account for the current tenant company

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
Account deleted successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.075Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
403	
Access denied or company mismatch

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.076Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Chart of account not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.078Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/chart-of-accounts
List chart of accounts


Retrieve chart of accounts for the current tenant company

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "groupName": "string",
  "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parentAccountCode": "string",
  "accountCode": "string",
  "accountName": "string",
  "accountTypes": [
    "DEBIT"
  ],
  "postingAllowed": true,
  "isActive": true,
  "minOpeningBalance": 0,
  "maxOpeningBalance": 0,
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16",
  "updatedFrom": "2026-07-16",
  "updatedTo": "2026-07-16"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
Responses
Code	Description	Links
200	
Accounts retrieved successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "data": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "groupName": "string",
        "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "parentAccountCode": "string",
        "accountCode": "string",
        "accountName": "string",
        "accountType": "DEBIT",
        "postingAllowed": true,
        "isActive": true,
        "openingBalance": 0,
        "deleted": true,
        "createdAt": "2026-07-16T14:19:04.081Z",
        "updatedAt": "2026-07-16T14:19:04.081Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.081Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
403	
Access denied or company mismatch

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "data": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "groupName": "string",
        "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "parentAccountCode": "string",
        "accountCode": "string",
        "accountName": "string",
        "accountType": "DEBIT",
        "postingAllowed": true,
        "isActive": true,
        "openingBalance": 0,
        "deleted": true,
        "createdAt": "2026-07-16T14:19:04.083Z",
        "updatedAt": "2026-07-16T14:19:04.083Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.083Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/chart-of-accounts
Create chart of account


Create a new chart of account under the current tenant company

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "accountCode": "string",
    "accountName": "string",
    "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountType": "DEBIT",
    "postingAllowed": true,
    "isActive": true,
    "openingBalance": 0
  }
}
Responses
Code	Description	Links
200	
Account created successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.089Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
400	
Invalid request payload

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.091Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
403	
Access denied or company mismatch

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.092Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Referenced entity not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:19:04.093Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
Accounts Receivable Invoices
Endpoints for AR Invoice management



GET
/api/v1/ar-invoices/{id}
Get AR invoice by ID

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.254Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.254Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.254Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.254Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.254Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/v1/ar-invoices/{id}
Update AR invoice

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
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "invoiceCurrency": "str",
    "exchangeRate": 0.000001,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0.01,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0.01,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "totalAmount": 0
      }
    ],
    "notes": "string",
    "dueDateValid": true
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
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.259Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.259Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.259Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.259Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.259Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/v1/ar-invoices/{id}
Delete AR invoice

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.263Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/v1/ar-invoices
Get all AR invoices with filtering

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceNumber": "string",
  "fromDate": "2026-07-16",
  "toDate": "2026-07-16",
  "dueDate": "2026-07-16",
  "status": "DRAFT",
  "isOverdue": true,
  "minAmount": 0,
  "maxAmount": 0,
  "minOutstanding": 0,
  "keyword": "string"
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNumber": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerCode": "string",
        "customerName": "string",
        "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "customerGstin": "string",
        "customerPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "isOverdue": true,
        "agingBucket": "string",
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "receivedAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemCode": "string",
            "itemName": "string",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "revenueAccountCode": "string",
            "revenueAccountName": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:23:31.265Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:23:31.265Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:23:31.265Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:23:31.265Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "receivable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.265Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices
Create AR invoice

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "invoiceCurrency": "str",
    "exchangeRate": 0.000001,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0.01,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0.01,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "totalAmount": 0
      }
    ],
    "notes": "string",
    "dueDateValid": true
  }
}
Responses
Code	Description	Links
201	
Created

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
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.269Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.269Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.269Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.269Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.269Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices/{id}/submit
Submit AR invoice for approval

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.273Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.273Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.273Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.273Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.273Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices/{id}/reverse
Reverse posted AR invoice

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.277Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.277Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.277Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.277Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.277Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices/{id}/reject
Reject AR invoice

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.287Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.287Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.287Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.287Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.287Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices/{id}/post
Post AR invoice to GL

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.291Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.291Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.291Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.291Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.291Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices/{id}/cancel
Cancel AR invoice

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.295Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.295Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.295Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.295Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.295Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/v1/ar-invoices/{id}/approve
Approve AR invoice

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNumber": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerCode": "string",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerGstin": "string",
    "customerPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "isOverdue": true,
    "agingBucket": "string",
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "outputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "receivedAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemCode": "string",
        "itemName": "string",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "revenueAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "revenueAccountCode": "string",
        "revenueAccountName": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:23:31.304Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:23:31.304Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:23:31.304Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:23:31.304Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "receivable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:23:31.304Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
AP Invoice Management
APIs for managing Accounts Payable invoices



GET
/api/account/invoices/{id}
Get invoice by ID

Retrieves a specific invoice by its ID

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

id
Responses
Code	Description	Links
200	
Invoice found

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceNo": "string",
  "status": "DRAFT",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyName": "string",
  "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "vendorCode": "string",
  "vendorName": "string",
  "vendorGstin": "string",
  "vendorPan": "string",
  "invoiceDate": "2026-07-16",
  "dueDate": "2026-07-16",
  "daysOverdue": 0,
  "invoiceCurrency": "string",
  "exchangeRate": 0,
  "baseCurrencyTotal": 0,
  "subtotal": 0,
  "taxAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tdsAmount": 0,
  "totalAmount": 0,
  "paidAmount": 0,
  "outstandingAmount": 0,
  "paymentPercentage": 0,
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "description": "string",
      "quantity": 0,
      "unitPrice": 0,
      "taxableAmount": 0,
      "taxAmount": 0,
      "totalAmount": 0,
      "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "itemCount": 0,
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedAt": "2026-07-16T14:29:43.695Z",
  "approvalStatus": "string",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingStatus": "string",
  "glPostingTime": "2026-07-16T14:29:43.695Z",
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:29:43.695Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:29:43.695Z",
  "notes": "string",
  "editable": true,
  "deletable": true,
  "approvable": true,
  "postable": true,
  "payable": true
}
No links
404	
Invoice not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.698Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.698Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.698Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.698Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.698Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}
Update an invoice

Updates an existing invoice (only DRAFT or PENDING_APPROVAL)

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

id
Request body

application/json
Example Value
Schema
{
  "data": {
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "invoiceCurrency": "str",
    "exchangeRate": 0.000001,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0.01,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "items": [
      {
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0.01,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "totalAmount": 0
      }
    ],
    "notes": "string",
    "dueDateValid": true
  }
}
Responses
Code	Description	Links
200	
Invoice updated successfully

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
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.702Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.702Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.702Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.702Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.702Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
400	
Invalid request or invoice not editable

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.704Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.704Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.704Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.704Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.704Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Invoice not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.706Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.706Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.706Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.706Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.707Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/invoices/{id}
Delete an invoice

Deletes an invoice (only DRAFT invoices can be deleted)

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

id
Responses
Code	Description	Links
200	
Invoice deleted successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.710Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
400	
Invoice not deletable

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.711Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Invoice not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.712Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}/submit
Submit an invoice for approval

Moves a DRAFT invoice to PENDING_APPROVAL

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.717Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.717Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.717Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.717Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.717Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}/reject
Reject an invoice

Rejects a PENDING_APPROVAL invoice

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.720Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.720Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.720Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.720Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.720Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}/post
Post invoice to GL

Posts an APPROVED invoice to General Ledger with double-entry accounting

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

id
Responses
Code	Description	Links
200	
Invoice posted successfully

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
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.724Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.724Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.724Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.724Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.724Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
400	
Invalid status or accounting period closed

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.727Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.727Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.727Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.727Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.727Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Invoice not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.730Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.730Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.730Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.730Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.730Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}/mark-paid
Mark invoice as fully paid

Marks an invoice as completely paid

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.733Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.733Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.733Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.733Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.733Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}/cancel
Cancel an invoice

Cancels an invoice (cannot cancel PAID invoices)

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.736Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.736Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.736Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.736Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.736Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/invoices/{id}/approve
Approve an invoice

Approves a PENDING_APPROVAL invoice

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

id
Responses
Code	Description	Links
200	
Invoice approved successfully

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
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.740Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.740Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.740Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.740Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.740Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
400	
Invalid status for approval

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.743Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.743Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.743Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.743Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.743Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
404	
Invoice not found

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.745Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.745Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.745Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.745Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.745Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices
Get all invoices

Retrieves all invoices for a company with pagination and advanced filtering

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceNo": "string",
  "statuses": [
    "DRAFT"
  ],
  "invoiceCurrency": "string",
  "minTotalAmount": 0,
  "maxTotalAmount": 0,
  "minOutstandingAmount": 0,
  "maxOutstandingAmount": 0,
  "invoiceDateFrom": "2026-07-16",
  "invoiceDateTo": "2026-07-16",
  "dueDateFrom": "2026-07-16",
  "dueDateTo": "2026-07-16",
  "isOverdue": true,
  "hasOutstandingBalance": true,
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
page
integer($int32)
(query)
Page number (0-indexed)

Default value : 0

0
size
integer($int32)
(query)
Page size

Default value : 20

20
sortBy
string
(query)
Sort field

Default value : invoiceDate

invoiceDate
direction
string
(query)
Sort direction (ASC/DESC)

Available values : ASC, DESC

Default value : DESC


DESC
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.751Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.751Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.751Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.751Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.751Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/invoices
Create a new AP invoice

Creates a new AP invoice with line items

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "invoiceCurrency": "str",
    "exchangeRate": 0.000001,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0.01,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "items": [
      {
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0.01,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "totalAmount": 0
      }
    ],
    "notes": "string",
    "dueDateValid": true
  }
}
Responses
Code	Description	Links
201	
Invoice created successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceNo": "string",
  "status": "DRAFT",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyName": "string",
  "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "vendorCode": "string",
  "vendorName": "string",
  "vendorGstin": "string",
  "vendorPan": "string",
  "invoiceDate": "2026-07-16",
  "dueDate": "2026-07-16",
  "daysOverdue": 0,
  "invoiceCurrency": "string",
  "exchangeRate": 0,
  "baseCurrencyTotal": 0,
  "subtotal": 0,
  "taxAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tdsAmount": 0,
  "totalAmount": 0,
  "paidAmount": 0,
  "outstandingAmount": 0,
  "paymentPercentage": 0,
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "description": "string",
      "quantity": 0,
      "unitPrice": 0,
      "taxableAmount": 0,
      "taxAmount": 0,
      "totalAmount": 0,
      "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "itemCount": 0,
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedAt": "2026-07-16T14:29:43.755Z",
  "approvalStatus": "string",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingStatus": "string",
  "glPostingTime": "2026-07-16T14:29:43.755Z",
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:29:43.755Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:29:43.755Z",
  "notes": "string",
  "editable": true,
  "deletable": true,
  "approvable": true,
  "postable": true,
  "payable": true
}
No links
400	
Invalid request data

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.757Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.757Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.757Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.757Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.757Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
409	
Duplicate invoice number

Media type

*/*
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.764Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.764Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.764Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.764Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.764Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/invoices/{id}/partial-payment
Record partial payment

Records a partial payment for an invoice

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
Invoice ID

id
paidAmount *
number
(query)
Payment amount

paidAmount
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
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.768Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.768Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.768Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.768Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.768Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/vendor/{vendorId}
Get vendor invoices

Retrieves all invoices for a specific vendor

Parameters
Try it out
Name	Description
vendorId *
string($uuid)
(path)
vendorId
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.773Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.773Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.773Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.773Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.773Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/vendor/{vendorId}/outstanding
Get vendor outstanding balance

Calculates total outstanding amount for a vendor

Parameters
Try it out
Name	Description
vendorId *
string($uuid)
(path)
vendorId
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
  "data": 0,
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.776Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/summary
Get invoice summary

Returns summary totals for invoices

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
    "additionalProp1": 0,
    "additionalProp2": 0,
    "additionalProp3": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.778Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/search
Search invoices

Search invoices by invoice number or vendor name

Parameters
Try it out
Name	Description
searchTerm *
string
(query)
Search term

searchTerm
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.781Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.781Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.781Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.781Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.781Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/partially-paid
Get partially paid invoices

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.784Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.784Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.784Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.784Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.784Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/paid
Get paid invoices

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.789Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.789Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.789Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.789Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.789Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/overdue
Get overdue invoices

Retrieves all overdue invoices

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.794Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.794Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.794Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.794Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.794Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/outstanding
Get outstanding invoices

Retrieves all outstanding/unpaid invoices

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "status": "DRAFT",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "vendorGstin": "string",
        "vendorPan": "string",
        "invoiceDate": "2026-07-16",
        "dueDate": "2026-07-16",
        "daysOverdue": 0,
        "invoiceCurrency": "string",
        "exchangeRate": 0,
        "baseCurrencyTotal": 0,
        "subtotal": 0,
        "taxAmount": 0,
        "cgstAmount": 0,
        "sgstAmount": 0,
        "igstAmount": 0,
        "cessAmount": 0,
        "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "tdsAmount": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "outstandingAmount": 0,
        "paymentPercentage": 0,
        "items": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "description": "string",
            "quantity": 0,
            "unitPrice": 0,
            "taxableAmount": 0,
            "taxAmount": 0,
            "totalAmount": 0,
            "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "createdAt": "string",
            "updatedAt": "string"
          }
        ],
        "itemCount": 0,
        "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "approvedAt": "2026-07-16T14:29:43.799Z",
        "approvalStatus": "string",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T14:29:43.799Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T14:29:43.799Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T14:29:43.799Z",
        "notes": "string",
        "editable": true,
        "deletable": true,
        "approvable": true,
        "postable": true,
        "payable": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.799Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/number/{invoiceNo}
Get invoice by invoice number

Retrieves an invoice by its invoice number (company-scoped)

Parameters
Try it out
Name	Description
invoiceNo *
string
(path)
Invoice number

invoiceNo
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
    "invoiceNo": "string",
    "status": "DRAFT",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "vendorGstin": "string",
    "vendorPan": "string",
    "invoiceDate": "2026-07-16",
    "dueDate": "2026-07-16",
    "daysOverdue": 0,
    "invoiceCurrency": "string",
    "exchangeRate": 0,
    "baseCurrencyTotal": 0,
    "subtotal": 0,
    "taxAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0,
    "inputCgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputSgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputIgstAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inputCessAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tdsAmount": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "outstandingAmount": 0,
    "paymentPercentage": 0,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "description": "string",
        "quantity": 0,
        "unitPrice": 0,
        "taxableAmount": 0,
        "taxAmount": 0,
        "totalAmount": 0,
        "expenseAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "itemCount": 0,
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedAt": "2026-07-16T14:29:43.803Z",
    "approvalStatus": "string",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T14:29:43.803Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T14:29:43.803Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T14:29:43.803Z",
    "notes": "string",
    "editable": true,
    "deletable": true,
    "approvable": true,
    "postable": true,
    "payable": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.803Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/invoices/aging
Get invoice aging report

Generates invoice aging report with buckets: 0-30, 31-60, 61-90, 90+ days

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
    "additionalProp1": {
      "bucketName": "string",
      "minDays": 0,
      "maxDays": 0,
      "totalAmount": 0,
      "count": 0
    },
    "additionalProp2": {
      "bucketName": "string",
      "minDays": 0,
      "maxDays": 0,
      "totalAmount": 0,
      "count": 0
    },
    "additionalProp3": {
      "bucketName": "string",
      "minDays": 0,
      "maxDays": 0,
      "totalAmount": 0,
      "count": 0
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:29:43.806Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
Invoice Taxes
Invoice tax management APIs



GET
/api/account/sales/invoices/{invoiceId}/taxes/{taxId}
Get invoice tax detail


Retrieve a single tax breakdown entry for a sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
taxId *
string($uuid)
(path)
taxId
Responses
Code	Description	Links
200	
Invoice tax retrieved successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.511Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.511Z",
  "isDeleted": true
}
No links
403	
Company mismatch or access denied

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.512Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.512Z",
  "isDeleted": true
}
No links
404	
Invoice tax not found

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.512Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.512Z",
  "isDeleted": true
}
No links

PUT
/api/account/sales/invoices/{invoiceId}/taxes/{taxId}
Update invoice tax


Update an existing tax breakdown entry for a sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
taxId *
string($uuid)
(path)
taxId
Request body

application/json
Example Value
Schema
{
  "data": {
    "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "taxableAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0
  }
}
Responses
Code	Description	Links
200	
Invoice tax updated successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.515Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.515Z",
  "isDeleted": true
}
No links
400	
Invalid request payload

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.516Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.516Z",
  "isDeleted": true
}
No links
403	
Company mismatch or access denied

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.517Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.517Z",
  "isDeleted": true
}
No links
404	
Invoice tax or sales invoice not found

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.517Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.517Z",
  "isDeleted": true
}
No links

DELETE
/api/account/sales/invoices/{invoiceId}/taxes/{taxId}
Delete invoice tax


Soft delete a tax breakdown entry for a sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
taxId *
string($uuid)
(path)
taxId
Responses
Code	Description	Links
204	
Invoice tax deleted successfully

No links
403	
Company mismatch or access denied

No links
404	
Invoice tax not found

No links

GET
/api/account/sales/invoices/{invoiceId}/taxes
List invoice taxes


Retrieve invoice tax entries for a specific sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
filter *
object
(query)
Example Value
Schema
{
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "isDeleted": true,
  "minTaxableAmount": 0,
  "maxTaxableAmount": 0,
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 20

20
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
Responses
Code	Description	Links
200	
Invoice taxes retrieved successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceNumber": "string",
      "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gstSlabName": "string",
      "taxableAmount": 0,
      "cgstAmount": 0,
      "sgstAmount": 0,
      "igstAmount": 0,
      "cessAmount": 0,
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-07-16T14:38:52.523Z",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedAt": "2026-07-16T14:38:52.523Z",
      "isDeleted": true
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links
403	
Company mismatch or access denied

Media type

*/*
Example Value
Schema
{
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceNumber": "string",
      "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gstSlabName": "string",
      "taxableAmount": 0,
      "cgstAmount": 0,
      "sgstAmount": 0,
      "igstAmount": 0,
      "cessAmount": 0,
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-07-16T14:38:52.525Z",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedAt": "2026-07-16T14:38:52.525Z",
      "isDeleted": true
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links
404	
Sales invoice not found

Media type

*/*
Example Value
Schema
{
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceNumber": "string",
      "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gstSlabName": "string",
      "taxableAmount": 0,
      "cgstAmount": 0,
      "sgstAmount": 0,
      "igstAmount": 0,
      "cessAmount": 0,
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-07-16T14:38:52.526Z",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedAt": "2026-07-16T14:38:52.526Z",
      "isDeleted": true
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links

POST
/api/account/sales/invoices/{invoiceId}/taxes
Create invoice tax


Create a new tax breakdown entry for a sales invoice

Parameters
Try it out
Name	Description
invoiceId *
string($uuid)
(path)
invoiceId
Request body

application/json
Example Value
Schema
{
  "data": {
    "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "taxableAmount": 0,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 0,
    "cessAmount": 0
  }
}
Responses
Code	Description	Links
201	
Invoice tax created successfully

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.528Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.528Z",
  "isDeleted": true
}
No links
400	
Invalid request payload

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.529Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.529Z",
  "isDeleted": true
}
No links
403	
Company mismatch or access denied

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.530Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.530Z",
  "isDeleted": true
}
No links
404	
Sales invoice or GST slab not found

Media type

*/*
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceNumber": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gstSlabName": "string",
  "taxableAmount": 0,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 0,
  "cessAmount": 0,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-16T14:38:52.531Z",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedAt": "2026-07-16T14:38:52.531Z",
  "isDeleted": true
}
No links
 vendor-controller


GET
/api/account/v1/vendors/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "paymentTerm": "string",
    "currencyCode": "string",
    "currencyName": "string",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
    "isActive": true,
    "createdAt": "2026-07-16T14:46:49.076Z",
    "updatedAt": "2026-07-16T14:46:49.076Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalPayments": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.076Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/v1/vendors/{id}

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
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "63TXZDD1665J4ZU",
    "panNo": "EYGAA3979X",
    "email": "user@example.com",
    "phone": "+83771-6 0-527048",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "defaultCurrency": "XMM",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
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
    "companyName": "string",
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "paymentTerm": "string",
    "currencyCode": "string",
    "currencyName": "string",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
    "isActive": true,
    "createdAt": "2026-07-16T14:46:49.244Z",
    "updatedAt": "2026-07-16T14:46:49.244Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalPayments": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.244Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/v1/vendors/{id}

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.098Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/v1/vendors/{id}/deactivate

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.102Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/v1/vendors/{id}/activate

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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.105Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "vendorCode": "string",
  "vendorName": "string",
  "email": "string",
  "phone": "string",
  "gstin": "string",
  "pan": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "pinCode": "string",
  "minCreditLimit": 0,
  "maxCreditLimit": 0,
  "isActive": true,
  "createdFrom": "2026-07-16T14:46:35.845Z",
  "createdTo": "2026-07-16T14:46:35.845Z",
  "updatedFrom": "2026-07-16T14:46:35.845Z",
  "updatedTo": "2026-07-16T14:46:35.845Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorCode": "string",
        "vendorName": "string",
        "gstin": "string",
        "panNo": "string",
        "email": "string",
        "phone": "string",
        "addressLine1": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "pinCode": "string",
        "creditLimit": 0,
        "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "payableAccountCode": "string",
        "payableAccountName": "string",
        "openingBalance": 0,
        "openingBalanceDate": "2026-07-16",
        "paymentTermDays": 0,
        "paymentTerm": "string",
        "currencyCode": "string",
        "currencyName": "string",
        "tdsApplicable": true,
        "tdsSection": "string",
        "tdsRate": 0,
        "isActive": true,
        "createdAt": "2026-07-16T14:46:49.109Z",
        "updatedAt": "2026-07-16T14:46:49.109Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outstandingBalance": 0,
        "availableCredit": 0,
        "totalInvoices": 0,
        "totalPayments": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.109Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/v1/vendors

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "96GQPOT0690NJZD",
    "panNo": "QVDGG1409Y",
    "email": "user@example.com",
    "phone": "20674831-9871 29",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "defaultCurrency": "GWS",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
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
    "companyName": "string",
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "paymentTerm": "string",
    "currencyCode": "string",
    "currencyName": "string",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
    "isActive": true,
    "createdAt": "2026-07-16T14:46:49.119Z",
    "updatedAt": "2026-07-16T14:46:49.119Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalPayments": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.119Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/{id}/transactions

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
fromDate
string($date)
(query)
fromDate
toDate
string($date)
(query)
toDate
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "fromDate": "2026-07-16",
    "toDate": "2026-07-16",
    "openingBalance": 0,
    "closingBalance": 0,
    "totalInvoices": 0,
    "totalPayments": 0,
    "ledgerLines": [
      {
        "transactionDate": "2026-07-16",
        "invoiceAmount": 0,
        "paymentAmount": 0,
        "balance": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.125Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/{id}/ledger

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
fromDate
string($date)
(query)
fromDate
toDate
string($date)
(query)
toDate
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "fromDate": "2026-07-16",
    "toDate": "2026-07-16",
    "openingBalance": 0,
    "closingBalance": 0,
    "totalInvoices": 0,
    "totalPayments": 0,
    "ledgerLines": [
      {
        "transactionDate": "2026-07-16",
        "invoiceAmount": 0,
        "paymentAmount": 0,
        "balance": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.131Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/state/{state}

Parameters
Try it out
Name	Description
state *
string
(path)
state
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorCode": "string",
        "vendorName": "string",
        "gstin": "string",
        "panNo": "string",
        "email": "string",
        "phone": "string",
        "addressLine1": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "pinCode": "string",
        "creditLimit": 0,
        "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "payableAccountCode": "string",
        "payableAccountName": "string",
        "openingBalance": 0,
        "openingBalanceDate": "2026-07-16",
        "paymentTermDays": 0,
        "paymentTerm": "string",
        "currencyCode": "string",
        "currencyName": "string",
        "tdsApplicable": true,
        "tdsSection": "string",
        "tdsRate": 0,
        "isActive": true,
        "createdAt": "2026-07-16T14:46:49.136Z",
        "updatedAt": "2026-07-16T14:46:49.136Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outstandingBalance": 0,
        "availableCredit": 0,
        "totalInvoices": 0,
        "totalPayments": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.136Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/search

Parameters
Try it out
Name	Description
query *
string
(query)
query
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorCode": "string",
        "vendorName": "string",
        "gstin": "string",
        "panNo": "string",
        "email": "string",
        "phone": "string",
        "addressLine1": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "pinCode": "string",
        "creditLimit": 0,
        "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "payableAccountCode": "string",
        "payableAccountName": "string",
        "openingBalance": 0,
        "openingBalanceDate": "2026-07-16",
        "paymentTermDays": 0,
        "paymentTerm": "string",
        "currencyCode": "string",
        "currencyName": "string",
        "tdsApplicable": true,
        "tdsSection": "string",
        "tdsRate": 0,
        "isActive": true,
        "createdAt": "2026-07-16T14:46:49.142Z",
        "updatedAt": "2026-07-16T14:46:49.142Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outstandingBalance": 0,
        "availableCredit": 0,
        "totalInvoices": 0,
        "totalPayments": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.142Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/pan/{pan}

Parameters
Try it out
Name	Description
pan *
string
(path)
pan
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
    "companyName": "string",
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "paymentTerm": "string",
    "currencyCode": "string",
    "currencyName": "string",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
    "isActive": true,
    "createdAt": "2026-07-16T14:46:49.148Z",
    "updatedAt": "2026-07-16T14:46:49.148Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalPayments": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.148Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/gstin/{gstin}

Parameters
Try it out
Name	Description
gstin *
string
(path)
gstin
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
    "companyName": "string",
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "paymentTerm": "string",
    "currencyCode": "string",
    "currencyName": "string",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
    "isActive": true,
    "createdAt": "2026-07-16T14:46:49.153Z",
    "updatedAt": "2026-07-16T14:46:49.153Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalPayments": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.153Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/country/{country}

Parameters
Try it out
Name	Description
country *
string
(path)
country
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorCode": "string",
        "vendorName": "string",
        "gstin": "string",
        "panNo": "string",
        "email": "string",
        "phone": "string",
        "addressLine1": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "pinCode": "string",
        "creditLimit": 0,
        "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "payableAccountCode": "string",
        "payableAccountName": "string",
        "openingBalance": 0,
        "openingBalanceDate": "2026-07-16",
        "paymentTermDays": 0,
        "paymentTerm": "string",
        "currencyCode": "string",
        "currencyName": "string",
        "tdsApplicable": true,
        "tdsSection": "string",
        "tdsRate": 0,
        "isActive": true,
        "createdAt": "2026-07-16T14:46:49.158Z",
        "updatedAt": "2026-07-16T14:46:49.158Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outstandingBalance": 0,
        "availableCredit": 0,
        "totalInvoices": 0,
        "totalPayments": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.158Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/code/{vendorCode}

Parameters
Try it out
Name	Description
vendorCode *
string
(path)
vendorCode
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
    "companyName": "string",
    "vendorCode": "string",
    "vendorName": "string",
    "gstin": "string",
    "panNo": "string",
    "email": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "pinCode": "string",
    "creditLimit": 0,
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "openingBalance": 0,
    "openingBalanceDate": "2026-07-16",
    "paymentTermDays": 0,
    "paymentTerm": "string",
    "currencyCode": "string",
    "currencyName": "string",
    "tdsApplicable": true,
    "tdsSection": "string",
    "tdsRate": 0,
    "isActive": true,
    "createdAt": "2026-07-16T14:46:49.165Z",
    "updatedAt": "2026-07-16T14:46:49.165Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "outstandingBalance": 0,
    "availableCredit": 0,
    "totalInvoices": 0,
    "totalPayments": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.165Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/city/{city}

Parameters
Try it out
Name	Description
city *
string
(path)
city
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorCode": "string",
        "vendorName": "string",
        "gstin": "string",
        "panNo": "string",
        "email": "string",
        "phone": "string",
        "addressLine1": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "pinCode": "string",
        "creditLimit": 0,
        "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "payableAccountCode": "string",
        "payableAccountName": "string",
        "openingBalance": 0,
        "openingBalanceDate": "2026-07-16",
        "paymentTermDays": 0,
        "paymentTerm": "string",
        "currencyCode": "string",
        "currencyName": "string",
        "tdsApplicable": true,
        "tdsSection": "string",
        "tdsRate": 0,
        "isActive": true,
        "createdAt": "2026-07-16T14:46:49.170Z",
        "updatedAt": "2026-07-16T14:46:49.170Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "outstandingBalance": 0,
        "availableCredit": 0,
        "totalInvoices": 0,
        "totalPayments": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.170Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/v1/vendors/active

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
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyName": "string",
      "vendorCode": "string",
      "vendorName": "string",
      "gstin": "string",
      "panNo": "string",
      "email": "string",
      "phone": "string",
      "addressLine1": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "pinCode": "string",
      "creditLimit": 0,
      "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "payableAccountCode": "string",
      "payableAccountName": "string",
      "openingBalance": 0,
      "openingBalanceDate": "2026-07-16",
      "paymentTermDays": 0,
      "paymentTerm": "string",
      "currencyCode": "string",
      "currencyName": "string",
      "tdsApplicable": true,
      "tdsSection": "string",
      "tdsRate": 0,
      "isActive": true,
      "createdAt": "2026-07-16T14:46:49.175Z",
      "updatedAt": "2026-07-16T14:46:49.175Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "outstandingBalance": 0,
      "availableCredit": 0,
      "totalInvoices": 0,
      "totalPayments": 0
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:46:49.175Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
receipt-voucher-controller


GET
/api/account/receipts/{id}

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.628Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.628Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

PUT
/api/account/receipts/{id}

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
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receiptDate": "2026-07-16",
    "receiptAmount": 0,
    "paymentMode": "CASH",
    "receiptNo": "string",
    "referenceNo": "string",
    "remarks": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocations": [
      {
        "arInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0
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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.635Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.635Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

DELETE
/api/account/receipts/{id}

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

No links

GET
/api/account/receipts

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "receiptNo": "string",
  "referenceNo": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "arInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentMode": "string",
  "receiptStatuses": [
    "DRAFT"
  ],
  "postingStatuses": [
    "DRAFT"
  ],
  "minAmount": 0,
  "maxAmount": 0,
  "receiptDateFrom": "2026-07-16",
  "receiptDateTo": "2026-07-16"
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "customerName": "string",
      "bankName": "string",
      "bankAccount": "string",
      "receiptNo": "string",
      "receiptDate": "2026-07-16",
      "receiptAmount": 0,
      "paymentMode": "CASH",
      "referenceNo": "string",
      "remarks": "string",
      "receiptStatus": "DRAFT",
      "glPostingStatus": "DRAFT",
      "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glPostingTime": "2026-07-16T14:51:02.642Z",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedDate": "2026-07-16T14:51:02.642Z",
      "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "receivableAccountCode": "string",
      "receivableAccountName": "string",
      "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "receiptAccountCode": "string",
      "receiptAccountName": "string",
      "totalAllocatedAmount": 0,
      "remainingBalance": 0,
      "journalNumber": "string",
      "allocations": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "invoiceNumber": "string",
          "allocatedAmount": 0
        }
      ]
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links

POST
/api/account/receipts

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receiptDate": "2026-07-16",
    "receiptAmount": 0,
    "paymentMode": "CASH",
    "receiptNo": "string",
    "referenceNo": "string",
    "remarks": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocations": [
      {
        "arInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0
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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.650Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.650Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

POST
/api/account/receipts/{id}/submit

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.655Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.655Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

POST
/api/account/receipts/{id}/reverse

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.660Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.660Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

POST
/api/account/receipts/{id}/reject

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.664Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.664Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

POST
/api/account/receipts/{id}/post

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.670Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.670Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

POST
/api/account/receipts/{id}/cancel

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.675Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.675Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links

POST
/api/account/receipts/{id}/approve

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "bankName": "string",
  "bankAccount": "string",
  "receiptNo": "string",
  "receiptDate": "2026-07-16",
  "receiptAmount": 0,
  "paymentMode": "CASH",
  "referenceNo": "string",
  "remarks": "string",
  "receiptStatus": "DRAFT",
  "glPostingStatus": "DRAFT",
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "glPostingTime": "2026-07-16T14:51:02.682Z",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedDate": "2026-07-16T14:51:02.682Z",
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receivableAccountCode": "string",
  "receivableAccountName": "string",
  "receiptAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "receiptAccountCode": "string",
  "receiptAccountName": "string",
  "totalAllocatedAmount": 0,
  "remainingBalance": 0,
  "journalNumber": "string",
  "allocations": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNumber": "string",
      "allocatedAmount": 0
    }
  ]
}
No links
payment-voucher-controller


GET
/api/account/payment-vouchers/{voucherId}

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.556Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.556Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.556Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/payment-vouchers/{voucherId}

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
Request body

application/json
Example Value
Schema
{
  "data": {
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0.01,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocations": [
      {
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0.01
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.559Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.559Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.559Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/payment-vouchers/{voucherId}

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.561Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/payment-vouchers

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "voucherNo": "string",
  "referenceNo": "string",
  "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deleted": true,
  "paymentModes": [
    "CASH"
  ],
  "paymentStatuses": [
    "UNPAID"
  ],
  "glPostingStatuses": [
    "DRAFT"
  ],
  "voucherStatus": "UNPAID",
  "postingStatus": "DRAFT",
  "paymentMode": "CASH",
  "minAmount": 0,
  "maxAmount": 0,
  "voucherDateFrom": "2026-07-16",
  "voucherDateTo": "2026-07-16"
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
      "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "vendorName": "string",
      "bankName": "string",
      "bankAccountName": "string",
      "bankAccountNumber": "string",
      "voucherNo": "string",
      "voucherDate": "2026-07-16",
      "paymentAmount": 0,
      "paymentMode": "CASH",
      "referenceNo": "string",
      "chequeNumber": "string",
      "chequeDate": "2026-07-16",
      "upiReferenceNumber": "string",
      "transactionReference": "string",
      "remarks": "string",
      "paymentStatus": "UNPAID",
      "glPostingStatus": "DRAFT",
      "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glPostingTime": "2026-07-16T14:54:41.562Z",
      "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedDate": "2026-07-16T14:54:41.562Z",
      "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "payableAccountCode": "string",
      "payableAccountName": "string",
      "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "paymentAccountCode": "string",
      "paymentAccountName": "string",
      "journalNumber": "string",
      "totalAllocatedAmount": 0,
      "remainingBalance": 0,
      "allocations": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "invoiceNo": "string",
          "allocatedAmount": 0
        }
      ]
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.562Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0.01,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocations": [
      {
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0.01
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.564Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.564Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.564Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers/{voucherId}/submit

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.566Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.566Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.566Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers/{voucherId}/reverse

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.568Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.568Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.568Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers/{voucherId}/reject

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.570Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.570Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.570Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers/{voucherId}/post

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.575Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.575Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.575Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers/{voucherId}/cancel

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.577Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.577Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.577Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/payment-vouchers/{voucherId}/approve

Parameters
Try it out
Name	Description
voucherId *
string($uuid)
(path)
voucherId
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "bankName": "string",
    "bankAccountName": "string",
    "bankAccountNumber": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "paymentAmount": 0,
    "paymentMode": "CASH",
    "referenceNo": "string",
    "chequeNumber": "string",
    "chequeDate": "2026-07-16",
    "upiReferenceNumber": "string",
    "transactionReference": "string",
    "remarks": "string",
    "paymentStatus": "UNPAID",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingTime": "2026-07-16T14:54:41.587Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T14:54:41.587Z",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "payableAccountCode": "string",
    "payableAccountName": "string",
    "paymentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentAccountCode": "string",
    "paymentAccountName": "string",
    "journalNumber": "string",
    "totalAllocatedAmount": 0,
    "remainingBalance": 0,
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:54:41.587Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
hsn-sac-master-controller


GET
/api/account/hsn-sac/{hsnSacId}

Parameters
Try it out
Name	Description
hsnSacId *
string($uuid)
(path)
hsnSacId
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
    "code": "string",
    "description": "string",
    "type": "HSN",
    "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "gstSlabName": "string",
    "cgstRate": 0,
    "sgstRate": 0,
    "igstRate": 0,
    "cessRate": 0,
    "deleted": true,
    "itemMappingCount": 0,
    "invoiceUsageCount": 0,
    "taxTransactionCount": 0,
    "createdAt": "2026-07-16T14:59:53.866Z",
    "updatedAt": "2026-07-16T14:59:53.866Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.866Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/hsn-sac/{hsnSacId}

Parameters
Try it out
Name	Description
hsnSacId *
string($uuid)
(path)
hsnSacId
Request body

application/json
Example Value
Schema
{
  "data": {
    "code": "ynutZXaSqQaVq",
    "description": "string",
    "type": "HSN",
    "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.871Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/hsn-sac/{hsnSacId}

Parameters
Try it out
Name	Description
hsnSacId *
string($uuid)
(path)
hsnSacId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.872Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/hsn-sac

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "code": "string",
  "type": "string",
  "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "isDeleted": true
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "hsnSacMasters": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "code": "string",
        "description": "string",
        "type": "HSN",
        "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "gstSlabName": "string",
        "cgstRate": 0,
        "sgstRate": 0,
        "igstRate": 0,
        "cessRate": 0,
        "deleted": true,
        "itemMappingCount": 0,
        "invoiceUsageCount": 0,
        "taxTransactionCount": 0,
        "createdAt": "2026-07-16T14:59:53.875Z",
        "updatedAt": "2026-07-16T14:59:53.875Z"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.876Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/hsn-sac

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "code": "3nbVbv0r8kA1e7CpGG7N",
    "description": "string",
    "type": "HSN",
    "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.886Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/hsn-sac/reports/sac

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
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "string",
      "description": "string",
      "type": "HSN",
      "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gstSlabName": "string",
      "cgstRate": 0,
      "sgstRate": 0,
      "igstRate": 0,
      "cessRate": 0,
      "deleted": true,
      "itemMappingCount": 0,
      "invoiceUsageCount": 0,
      "taxTransactionCount": 0,
      "createdAt": "2026-07-16T14:59:53.887Z",
      "updatedAt": "2026-07-16T14:59:53.887Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.887Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/hsn-sac/reports/hsn

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
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "string",
      "description": "string",
      "type": "HSN",
      "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gstSlabName": "string",
      "cgstRate": 0,
      "sgstRate": 0,
      "igstRate": 0,
      "cessRate": 0,
      "deleted": true,
      "itemMappingCount": 0,
      "invoiceUsageCount": 0,
      "taxTransactionCount": 0,
      "createdAt": "2026-07-16T14:59:53.890Z",
      "updatedAt": "2026-07-16T14:59:53.890Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.890Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/hsn-sac/code/{code}

Parameters
Try it out
Name	Description
code *
string
(path)
code
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
    "code": "string",
    "description": "string",
    "type": "HSN",
    "gstSlabId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "gstSlabName": "string",
    "cgstRate": 0,
    "sgstRate": 0,
    "igstRate": 0,
    "cessRate": 0,
    "deleted": true,
    "itemMappingCount": 0,
    "invoiceUsageCount": 0,
    "taxTransactionCount": 0,
    "createdAt": "2026-07-16T14:59:53.894Z",
    "updatedAt": "2026-07-16T14:59:53.894Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T14:59:53.894Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
gst-slab-controller


GET
/api/account/gst-slabs/{gstSlabId}

Parameters
Try it out
Name	Description
gstSlabId *
string($uuid)
(path)
gstSlabId
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
    "slabName": "string",
    "cgstRate": 0,
    "sgstRate": 0,
    "igstRate": 0,
    "cessRate": 0,
    "effectiveFrom": "2026-07-16",
    "createdAt": "2026-07-16T15:01:34.945Z",
    "updatedAt": "2026-07-16T15:01:34.945Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:01:34.945Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/gst-slabs/{gstSlabId}

Parameters
Try it out
Name	Description
gstSlabId *
string($uuid)
(path)
gstSlabId
Request body

application/json
Example Value
Schema
{
  "data": {
    "slabName": "string",
    "cgstRate": 100,
    "sgstRate": 100,
    "igstRate": 100,
    "cessRate": 100,
    "effectiveFrom": "2026-07-16"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:01:34.950Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/gst-slabs/{gstSlabId}

Parameters
Try it out
Name	Description
gstSlabId *
string($uuid)
(path)
gstSlabId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:01:34.952Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gst-slabs

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "slabName": "string",
  "isDeleted": true,
  "minTotalRate": 0,
  "maxTotalRate": 0,
  "effectiveFromStart": "2026-07-16",
  "effectiveFromEnd": "2026-07-16",
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16",
  "updatedFrom": "2026-07-16",
  "updatedTo": "2026-07-16"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "gstSlabs": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "slabName": "string",
        "cgstRate": 0,
        "sgstRate": 0,
        "igstRate": 0,
        "cessRate": 0,
        "effectiveFrom": "2026-07-16",
        "createdAt": "2026-07-16T15:01:34.958Z",
        "updatedAt": "2026-07-16T15:01:34.958Z"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:01:34.958Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/gst-slabs

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "slabName": "string",
    "cgstRate": 100,
    "sgstRate": 100,
    "igstRate": 100,
    "cessRate": 100,
    "effectiveFrom": "2026-07-16"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:01:34.962Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
gl-journal-entry-controller


GET
/api/account/gl/journals/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearValue": "string",
    "accountingPeriodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodName": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "sourceModule": "string",
    "sourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "narration": "string",
    "status": "DRAFT",
    "totalDebit": 0,
    "totalCredit": 0,
    "isBalanced": true,
    "hashValue": "string",
    "previousHash": "string",
    "hashAlgorithm": "string",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postedAt": "2026-07-16T15:04:04.380Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:04:04.380Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T15:04:04.380Z",
    "isDeleted": true,
    "journalLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "baseAmount": 0,
        "currencyCode": "string",
        "exchangeRate": 0,
        "lineDescription": "string",
        "createdAt": "2026-07-16T15:04:04.380Z",
        "isDeleted": true
      }
    ],
    "lineCount": 0,
    "debitLineCount": 0,
    "creditLineCount": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.380Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/gl/journals/{id}

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
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "narration": "string",
    "journalLines": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "debitAmount": 0,
        "creditAmount": 0,
        "currencyCode": "str",
        "exchangeRate": 0.000001,
        "lineDescription": "string"
      },
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "debitAmount": 0,
        "creditAmount": 0,
        "currencyCode": "str",
        "exchangeRate": 0.000001,
        "lineDescription": "string"
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
    "companyName": "string",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearValue": "string",
    "accountingPeriodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodName": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "sourceModule": "string",
    "sourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "narration": "string",
    "status": "DRAFT",
    "totalDebit": 0,
    "totalCredit": 0,
    "isBalanced": true,
    "hashValue": "string",
    "previousHash": "string",
    "hashAlgorithm": "string",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postedAt": "2026-07-16T15:04:04.386Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:04:04.386Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T15:04:04.386Z",
    "isDeleted": true,
    "journalLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "baseAmount": 0,
        "currencyCode": "string",
        "exchangeRate": 0,
        "lineDescription": "string",
        "createdAt": "2026-07-16T15:04:04.386Z",
        "isDeleted": true
      }
    ],
    "lineCount": 0,
    "debitLineCount": 0,
    "creditLineCount": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.386Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/gl/journals/{id}

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.389Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gl/journals

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "voucherNo": "string",
  "referenceNo": "string",
  "sourceModules": [
    "string"
  ],
  "sourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "statuses": [
    "DRAFT"
  ],
  "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountingPeriodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "minAmount": 0,
  "maxAmount": 0,
  "voucherDateFrom": "2026-07-16",
  "voucherDateTo": "2026-07-16",
  "isUnbalanced": true,
  "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 10

10
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "companyName": "string",
        "sourceModule": "string",
        "referenceNo": "string",
        "narration": "string",
        "totalDebit": 0,
        "totalCredit": 0,
        "status": "DRAFT",
        "isBalanced": true,
        "lineCount": 0,
        "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "postedAt": "string",
        "createdAt": "string",
        "isDeleted": true
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.403Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/gl/journals

Parameters
Try it out
Name	Description
companyIdUUID
string($uuid)
(query)
companyIdUUID
Request body

application/json
Example Value
Schema
{
  "data": {
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "narration": "string",
    "journalLines": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "debitAmount": 0,
        "creditAmount": 0,
        "currencyCode": "str",
        "exchangeRate": 0.000001,
        "lineDescription": "string"
      },
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "debitAmount": 0,
        "creditAmount": 0,
        "currencyCode": "str",
        "exchangeRate": 0.000001,
        "lineDescription": "string"
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
    "companyName": "string",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearValue": "string",
    "accountingPeriodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodName": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "sourceModule": "string",
    "sourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "narration": "string",
    "status": "DRAFT",
    "totalDebit": 0,
    "totalCredit": 0,
    "isBalanced": true,
    "hashValue": "string",
    "previousHash": "string",
    "hashAlgorithm": "string",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postedAt": "2026-07-16T15:04:04.409Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:04:04.409Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T15:04:04.409Z",
    "isDeleted": true,
    "journalLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "baseAmount": 0,
        "currencyCode": "string",
        "exchangeRate": 0,
        "lineDescription": "string",
        "createdAt": "2026-07-16T15:04:04.409Z",
        "isDeleted": true
      }
    ],
    "lineCount": 0,
    "debitLineCount": 0,
    "creditLineCount": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.409Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/gl/journals/{id}/reverse

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearValue": "string",
    "accountingPeriodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodName": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "sourceModule": "string",
    "sourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "narration": "string",
    "status": "DRAFT",
    "totalDebit": 0,
    "totalCredit": 0,
    "isBalanced": true,
    "hashValue": "string",
    "previousHash": "string",
    "hashAlgorithm": "string",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postedAt": "2026-07-16T15:04:04.416Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:04:04.416Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T15:04:04.416Z",
    "isDeleted": true,
    "journalLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "baseAmount": 0,
        "currencyCode": "string",
        "exchangeRate": 0,
        "lineDescription": "string",
        "createdAt": "2026-07-16T15:04:04.416Z",
        "isDeleted": true
      }
    ],
    "lineCount": 0,
    "debitLineCount": 0,
    "creditLineCount": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.416Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/gl/journals/{id}/post

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearValue": "string",
    "accountingPeriodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodName": "string",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "referenceNo": "string",
    "sourceModule": "string",
    "sourceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "narration": "string",
    "status": "DRAFT",
    "totalDebit": 0,
    "totalCredit": 0,
    "isBalanced": true,
    "hashValue": "string",
    "previousHash": "string",
    "hashAlgorithm": "string",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postedAt": "2026-07-16T15:04:04.423Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:04:04.423Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T15:04:04.423Z",
    "isDeleted": true,
    "journalLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "baseAmount": 0,
        "currencyCode": "string",
        "exchangeRate": 0,
        "lineDescription": "string",
        "createdAt": "2026-07-16T15:04:04.423Z",
        "isDeleted": true
      }
    ],
    "lineCount": 0,
    "debitLineCount": 0,
    "creditLineCount": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.423Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/gl/journals/{id}/cancel

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.431Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gl/journals/{id}/pdf

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

No links

GET
/api/account/gl/journals/trial-balance

Parameters
Try it out
Name	Description
startDate
string($date)
(query)
startDate
endDate
string($date)
(query)
endDate
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 10

10
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "accountNature": "string",
        "openingBalance": 0,
        "debitAmount": 0,
        "creditAmount": 0,
        "closingBalance": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.441Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gl/journals/trial-balance/pdf

Parameters
Try it out
Name	Description
startDate
string($date)
(query)
startDate
endDate
string($date)
(query)
endDate
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

No links

GET
/api/account/gl/journals/profit-loss

Parameters
Try it out
Name	Description
fiscalYearId *
string($uuid)
(query)
fiscalYearId
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
    "totalIncome": 0,
    "totalExpenses": 0,
    "netProfitOrLoss": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.449Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gl/journals/profit-loss/pdf

Parameters
Try it out
Name	Description
fiscalYearId *
string($uuid)
(query)
fiscalYearId
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

No links

GET
/api/account/gl/journals/general-ledger

Parameters
Try it out
Name	Description
accountId *
string($uuid)
(query)
accountId
startDate
string($date)
(query)
startDate
endDate
string($date)
(query)
endDate
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 10

10
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherNo": "string",
        "voucherDate": "2026-07-16",
        "narration": "string",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "runningBalance": 0
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.457Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gl/journals/general-ledger/pdf

Parameters
Try it out
Name	Description
accountId *
string($uuid)
(query)
accountId
startDate
string($date)
(query)
startDate
endDate
string($date)
(query)
endDate
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

No links

GET
/api/account/gl/journals/balance-sheet

Parameters
Try it out
Name	Description
fiscalYearId *
string($uuid)
(query)
fiscalYearId
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
    "totalAssets": 0,
    "totalLiabilities": 0,
    "totalEquity": 0,
    "totalAssetsAndEquity": 0
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:04:04.466Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/gl/journals/balance-sheet/pdf

Parameters
Try it out
Name	Description
fiscalYearId *
string($uuid)
(query)
fiscalYearId
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

No links
 gl-journal-line-controller


GET
/api/account/gl/journal-lines/{id}

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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "voucherNo": "string",
  "voucherDate": "2026-07-16",
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountCode": "string",
  "accountName": "string",
  "debitAmount": 0,
  "creditAmount": 0,
  "baseAmount": 0,
  "currencyCode": "string",
  "exchangeRate": 0,
  "lineDescription": "string",
  "createdAt": "2026-07-16T15:17:49.271Z",
  "isDeleted": true
}
No links

PUT
/api/account/gl/journal-lines/{id}

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
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "debitAmount": 0,
    "creditAmount": 0,
    "currencyCode": "str",
    "exchangeRate": 0.000001,
    "lineDescription": "string"
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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "voucherNo": "string",
  "voucherDate": "2026-07-16",
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountCode": "string",
  "accountName": "string",
  "debitAmount": 0,
  "creditAmount": 0,
  "baseAmount": 0,
  "currencyCode": "string",
  "exchangeRate": 0,
  "lineDescription": "string",
  "createdAt": "2026-07-16T15:17:49.274Z",
  "isDeleted": true
}
No links

DELETE
/api/account/gl/journal-lines/{id}

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

No links

GET
/api/account/gl/journal-lines/journal/{journalId}

Parameters
Try it out
Name	Description
journalId *
string($uuid)
(path)
journalId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "voucherNo": "string",
      "voucherDate": "2026-07-16",
      "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "accountCode": "string",
      "accountName": "string",
      "debitAmount": 0,
      "creditAmount": 0,
      "baseAmount": 0,
      "currencyCode": "string",
      "exchangeRate": 0,
      "lineDescription": "string",
      "createdAt": "2026-07-16T15:17:49.285Z",
      "isDeleted": true
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links

POST
/api/account/gl/journal-lines/journal/{journalId}

Parameters
Try it out
Name	Description
journalId *
string($uuid)
(path)
journalId
Request body

application/json
Example Value
Schema
{
  "data": {
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "debitAmount": 0,
    "creditAmount": 0,
    "currencyCode": "str",
    "exchangeRate": 0.000001,
    "lineDescription": "string"
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
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "voucherNo": "string",
  "voucherDate": "2026-07-16",
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountCode": "string",
  "accountName": "string",
  "debitAmount": 0,
  "creditAmount": 0,
  "baseAmount": 0,
  "currencyCode": "string",
  "exchangeRate": 0,
  "lineDescription": "string",
  "createdAt": "2026-07-16T15:17:49.289Z",
  "isDeleted": true
}
No links

GET
/api/account/gl/journal-lines

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "minDebitAmount": 0,
  "maxDebitAmount": 0,
  "minCreditAmount": 0,
  "maxCreditAmount": 0,
  "currencyCode": "string",
  "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "costCenter": "string",
  "description": "string",
  "referenceNumber": "string",
  "isDeleted": true
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
Default value : id

id
sortDir
string
(query)
Default value : desc

desc
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
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "voucherNo": "string",
      "voucherDate": "2026-07-16",
      "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "accountCode": "string",
      "accountName": "string",
      "debitAmount": 0,
      "creditAmount": 0,
      "baseAmount": 0,
      "currencyCode": "string",
      "exchangeRate": 0,
      "lineDescription": "string",
      "createdAt": "2026-07-16T15:17:49.294Z",
      "isDeleted": true
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links

GET
/api/account/gl/journal-lines/ledger/{accountId}

Parameters
Try it out
Name	Description
accountId *
string($uuid)
(path)
accountId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "voucherNo": "string",
    "voucherDate": "2026-07-16",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountCode": "string",
    "accountName": "string",
    "debitAmount": 0,
    "creditAmount": 0,
    "baseAmount": 0,
    "currencyCode": "string",
    "exchangeRate": 0,
    "lineDescription": "string",
    "createdAt": "2026-07-16T15:17:49.297Z",
    "isDeleted": true
  }
]
No links

GET
/api/account/gl/journal-lines/account/{accountId}

Parameters
Try it out
Name	Description
accountId *
string($uuid)
(path)
accountId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "totalPages": 0,
  "totalElements": 0,
  "first": true,
  "last": true,
  "size": 0,
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "voucherNo": "string",
      "voucherDate": "2026-07-16",
      "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "accountCode": "string",
      "accountName": "string",
      "debitAmount": 0,
      "creditAmount": 0,
      "baseAmount": 0,
      "currencyCode": "string",
      "exchangeRate": 0,
      "lineDescription": "string",
      "createdAt": "2026-07-16T15:17:49.299Z",
      "isDeleted": true
    }
  ],
  "number": 0,
  "sort": {
    "empty": true,
    "unsorted": true,
    "sorted": true
  },
  "numberOfElements": 0,
  "pageable": {
    "offset": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "unpaged": true,
    "paged": true,
    "pageNumber": 0,
    "pageSize": 0
  },
  "empty": true
}
No links
fiscal-year-controller


GET
/api/account/fiscal-years/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "fiscalYear": "string",
    "startDate": "2026-07-16",
    "endDate": "2026-07-16",
    "isClosed": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:30:59.426Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/fiscal-years/{id}

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
    "preset": "INDIA_APR_MAR",
    "fiscalYear": "4068-7818",
    "startDate": "2026-07-16",
    "endDate": "2026-07-16",
    "baseYear": 0,
    "periodType": "MONTHLY",
    "isClosed": true
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:30:59.437Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/fiscal-years/{id}

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:30:59.439Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/fiscal-years

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "fiscalYearName": "string",
  "isClosed": true,
  "startDateFrom": "2026-07-16",
  "startDateTo": "2026-07-16",
  "endDateFrom": "2026-07-16",
  "endDateTo": "2026-07-16",
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16",
  "updatedFrom": "2026-07-16",
  "updatedTo": "2026-07-16"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "fiscalYears": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "fiscalYear": "string",
        "startDate": "2026-07-16",
        "endDate": "2026-07-16",
        "isClosed": true
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:30:59.444Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/fiscal-years

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
    "preset": "INDIA_APR_MAR",
    "fiscalYear": "7526-0595",
    "startDate": "2026-07-16",
    "endDate": "2026-07-16",
    "baseYear": 0,
    "periodType": "MONTHLY",
    "isClosed": true
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:30:59.449Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/account/fiscal-years/{id}/status

Parameters
Try it out
Name	Description
status *
boolean
(query)

--
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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:30:59.452Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
credit-note-controller


GET
/api/account/credit-notes/{creditNoteId}

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.737Z",
    "updatedAt": "2026-07-16T15:37:10.737Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.737Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.737Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.737Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/credit-notes/{creditNoteId}

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
Request body

application/json
Example Value
Schema
{
  "data": {
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.741Z",
    "updatedAt": "2026-07-16T15:37:10.741Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.741Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.741Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.741Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/credit-notes/{creditNoteId}

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
  "data": "string",
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.743Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/credit-notes

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "creditNoteNo": "string",
  "referenceNo": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "statuses": [
    "DRAFT"
  ],
  "glPostingStatuses": [
    "DRAFT"
  ],
  "minAmount": 0,
  "maxAmount": 0,
  "noteDateFrom": "2026-07-16",
  "noteDateTo": "2026-07-16"
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
      "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNo": "string",
      "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "customerName": "string",
      "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "creditNoteNo": "string",
      "noteDate": "2026-07-16",
      "amount": 0,
      "gstAmount": 0,
      "referenceNo": "string",
      "reason": "string",
      "status": "DRAFT",
      "glPostingStatus": "DRAFT",
      "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-07-16T15:37:10.747Z",
      "updatedAt": "2026-07-16T15:37:10.747Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "approvedDate": "2026-07-16T15:37:10.747Z",
      "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "postingTime": "2026-07-16T15:37:10.747Z",
      "postingStatus": "DRAFT"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.747Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/credit-notes

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.750Z",
    "updatedAt": "2026-07-16T15:37:10.750Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.750Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.750Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.750Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/credit-notes/{creditNoteId}/submit

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.753Z",
    "updatedAt": "2026-07-16T15:37:10.753Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.753Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.753Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.753Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/credit-notes/{creditNoteId}/reverse

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.763Z",
    "updatedAt": "2026-07-16T15:37:10.763Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.763Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.763Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.763Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/credit-notes/{creditNoteId}/post

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.765Z",
    "updatedAt": "2026-07-16T15:37:10.765Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.765Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.765Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.765Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/credit-notes/{creditNoteId}/cancel

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.768Z",
    "updatedAt": "2026-07-16T15:37:10.768Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.768Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.768Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.768Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/credit-notes/{creditNoteId}/approve

Parameters
Try it out
Name	Description
creditNoteId *
string($uuid)
(path)
creditNoteId
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
    "salesInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "string",
    "receivableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "revenueAdjustmentAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "creditNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T15:37:10.770Z",
    "updatedAt": "2026-07-16T15:37:10.770Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedDate": "2026-07-16T15:37:10.770Z",
    "postedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postingTime": "2026-07-16T15:37:10.770Z",
    "postingStatus": "DRAFT"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:37:10.770Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
budget-line-controller


GET
/api/account/budget-lines/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountCode": "string",
    "accountName": "string",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0,
    "actualExpense": 0,
    "remainingAmount": 0,
    "utilizationPercentage": 0,
    "varianceAmount": 0,
    "variancePercentage": 0,
    "varianceType": "string",
    "createdAt": "2026-07-16T15:41:53.792Z",
    "updatedAt": "2026-07-16T15:41:53.792Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.792Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/budget-lines/{id}

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
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0
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
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountCode": "string",
    "accountName": "string",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0,
    "actualExpense": 0,
    "remainingAmount": 0,
    "utilizationPercentage": 0,
    "varianceAmount": 0,
    "variancePercentage": 0,
    "varianceType": "string",
    "createdAt": "2026-07-16T15:41:53.796Z",
    "updatedAt": "2026-07-16T15:41:53.796Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.796Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/budget-lines/{id}

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.804Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/budget-lines/{id}/utilization

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.806Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-lines

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "minAllocatedAmount": 0,
  "maxAllocatedAmount": 0,
  "minUtilizedAmount": 0,
  "maxUtilizedAmount": 0,
  "minRemainingAmount": 0,
  "maxRemainingAmount": 0,
  "fromDate": "2026-07-16",
  "toDate": "2026-07-16",
  "searchKeyword": "string",
  "isDeleted": true
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "budgetLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0,
        "utilizedAmount": 0,
        "actualExpense": 0,
        "remainingAmount": 0,
        "utilizationPercentage": 0,
        "varianceAmount": 0,
        "variancePercentage": 0,
        "varianceType": "string",
        "createdAt": "2026-07-16T15:41:53.810Z",
        "updatedAt": "2026-07-16T15:41:53.810Z"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.810Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/budget-lines

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0
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
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountCode": "string",
    "accountName": "string",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0,
    "actualExpense": 0,
    "remainingAmount": 0,
    "utilizationPercentage": 0,
    "varianceAmount": 0,
    "variancePercentage": 0,
    "varianceType": "string",
    "createdAt": "2026-07-16T15:41:53.813Z",
    "updatedAt": "2026-07-16T15:41:53.813Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.813Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-lines/variance-report

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 10

10
budgetHeaderId
string($uuid)
(query)
budgetHeaderId
accountId
string($uuid)
(query)
accountId
departmentId
string($uuid)
(query)
departmentId
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
    "varianceLines": [
      {
        "budgetLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "budgetHeaderName": "string",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0,
        "actualExpense": 0,
        "remainingAmount": 0,
        "varianceAmount": 0,
        "variancePercentage": 0,
        "varianceType": "string"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.817Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-lines/summary

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
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "totalAllocated": 0,
    "totalUtilized": 0,
    "totalRemaining": 0,
    "averageUtilizationPercentage": 0,
    "totalBudgetLines": 0,
    "overAllocatedLines": 0,
    "underUtilizedLines": 0,
    "generatedAt": "2026-07-16T15:41:53.820Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.820Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-lines/header/{budgetHeaderId}

Parameters
Try it out
Name	Description
budgetHeaderId *
string($uuid)
(path)
budgetHeaderId
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 10

10
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
    "budgetLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0,
        "utilizedAmount": 0,
        "actualExpense": 0,
        "remainingAmount": 0,
        "utilizationPercentage": 0,
        "varianceAmount": 0,
        "variancePercentage": 0,
        "varianceType": "string",
        "createdAt": "2026-07-16T15:41:53.825Z",
        "updatedAt": "2026-07-16T15:41:53.825Z"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.825Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-lines/account/{accountId}

Parameters
Try it out
Name	Description
accountId *
string($uuid)
(path)
accountId
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 10

10
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
    "budgetLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0,
        "utilizedAmount": 0,
        "actualExpense": 0,
        "remainingAmount": 0,
        "utilizationPercentage": 0,
        "varianceAmount": 0,
        "variancePercentage": 0,
        "varianceType": "string",
        "createdAt": "2026-07-16T15:41:53.829Z",
        "updatedAt": "2026-07-16T15:41:53.829Z"
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:41:53.829Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
   budget-header-controller


GET
/api/account/budget-headers/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fiscalYearName": "string",
    "budgetName": "string",
    "totalBudget": 0,
    "totalAllocated": 0,
    "totalUtilized": 0,
    "remainingBudget": 0,
    "createdAt": "2026-07-16T15:51:28.334Z",
    "updatedAt": "2026-07-16T15:51:28.334Z",
    "budgetLines": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0,
        "utilizedAmount": 0,
        "actualExpense": 0,
        "remainingAmount": 0,
        "utilizationPercentage": 0,
        "varianceAmount": 0,
        "variancePercentage": 0,
        "varianceType": "string",
        "createdAt": "2026-07-16T15:51:28.334Z",
        "updatedAt": "2026-07-16T15:51:28.334Z"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.334Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/budget-headers/{id}

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
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "budgetName": "string",
    "totalBudget": 0
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.339Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/budget-headers/{id}

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.348Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/budget-headers/lines/{lineId}

Parameters
Try it out
Name	Description
lineId *
string($uuid)
(path)
lineId
Request body

application/json
Example Value
Schema
{
  "data": {
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.353Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/budget-headers/lines/{lineId}

Parameters
Try it out
Name	Description
lineId *
string($uuid)
(path)
lineId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.356Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-headers

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "minTotalBudget": 0,
  "maxTotalBudget": 0,
  "isDeleted": true
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "budgetHeaders": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fiscalYearName": "string",
        "budgetName": "string",
        "totalBudget": 0,
        "totalAllocated": 0,
        "totalUtilized": 0,
        "remainingBudget": 0,
        "createdAt": "2026-07-16T15:51:28.361Z",
        "updatedAt": "2026-07-16T15:51:28.361Z",
        "budgetLines": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "accountCode": "string",
            "accountName": "string",
            "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "allocatedAmount": 0,
            "utilizedAmount": 0,
            "actualExpense": 0,
            "remainingAmount": 0,
            "utilizationPercentage": 0,
            "varianceAmount": 0,
            "variancePercentage": 0,
            "varianceType": "string",
            "createdAt": "2026-07-16T15:51:28.361Z",
            "updatedAt": "2026-07-16T15:51:28.361Z"
          }
        ]
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.361Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/budget-headers

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "budgetName": "string",
    "totalBudget": 0
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.367Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/budget-headers/{budgetHeaderId}/lines

Parameters
Try it out
Name	Description
budgetHeaderId *
string($uuid)
(path)
budgetHeaderId
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
      "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "accountCode": "string",
      "accountName": "string",
      "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "allocatedAmount": 0,
      "utilizedAmount": 0,
      "actualExpense": 0,
      "remainingAmount": 0,
      "utilizationPercentage": 0,
      "varianceAmount": 0,
      "variancePercentage": 0,
      "varianceType": "string",
      "createdAt": "2026-07-16T15:51:28.370Z",
      "updatedAt": "2026-07-16T15:51:28.370Z"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.370Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/budget-headers/{budgetHeaderId}/lines

Parameters
Try it out
Name	Description
budgetHeaderId *
string($uuid)
(path)
budgetHeaderId
Request body

application/json
Example Value
Schema
{
  "data": {
    "budgetHeaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocatedAmount": 0,
    "utilizedAmount": 0
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T15:51:28.373Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
bank-transaction-controller


GET
/api/account/bank-transactions/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccount": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankName": "string",
      "branchName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "upiId": "string",
      "accountType": "SAVINGS",
      "openingBalance": 0,
      "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glAccountCode": "string",
      "glAccountName": "string",
      "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerAccountName": "string",
      "currentBalance": 0,
      "reconciledBalance": 0,
      "transactionCount": 0,
      "isActive": true,
      "status": "string",
      "createdAt": "2026-07-16T16:03:02.009Z",
      "updatedAt": "2026-07-16T16:03:02.009Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "transactionAmount": 0,
    "narration": "string",
    "reconciled": true,
    "reconciledDate": "2026-07-16T16:03:02.009Z",
    "runningBalance": 0,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glStatus": "string",
    "createdAt": "2026-07-16T16:03:02.009Z",
    "updatedAt": "2026-07-16T16:03:02.009Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.009Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/bank-transactions/{id}

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
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "narration": "string",
    "reconciled": true
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
    "bankAccount": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankName": "string",
      "branchName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "upiId": "string",
      "accountType": "SAVINGS",
      "openingBalance": 0,
      "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glAccountCode": "string",
      "glAccountName": "string",
      "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerAccountName": "string",
      "currentBalance": 0,
      "reconciledBalance": 0,
      "transactionCount": 0,
      "isActive": true,
      "status": "string",
      "createdAt": "2026-07-16T16:03:02.019Z",
      "updatedAt": "2026-07-16T16:03:02.019Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "transactionAmount": 0,
    "narration": "string",
    "reconciled": true,
    "reconciledDate": "2026-07-16T16:03:02.019Z",
    "runningBalance": 0,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glStatus": "string",
    "createdAt": "2026-07-16T16:03:02.019Z",
    "updatedAt": "2026-07-16T16:03:02.019Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.019Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/bank-transactions/{id}

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

No links

PUT
/api/account/bank-transactions/{id}/unreconcile

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccount": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankName": "string",
      "branchName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "upiId": "string",
      "accountType": "SAVINGS",
      "openingBalance": 0,
      "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glAccountCode": "string",
      "glAccountName": "string",
      "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerAccountName": "string",
      "currentBalance": 0,
      "reconciledBalance": 0,
      "transactionCount": 0,
      "isActive": true,
      "status": "string",
      "createdAt": "2026-07-16T16:03:02.035Z",
      "updatedAt": "2026-07-16T16:03:02.035Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "transactionAmount": 0,
    "narration": "string",
    "reconciled": true,
    "reconciledDate": "2026-07-16T16:03:02.035Z",
    "runningBalance": 0,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glStatus": "string",
    "createdAt": "2026-07-16T16:03:02.035Z",
    "updatedAt": "2026-07-16T16:03:02.035Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.035Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/bank-transactions/{id}/reverse

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
narration
string
(query)
narration
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
    "bankAccount": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankName": "string",
      "branchName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "upiId": "string",
      "accountType": "SAVINGS",
      "openingBalance": 0,
      "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glAccountCode": "string",
      "glAccountName": "string",
      "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerAccountName": "string",
      "currentBalance": 0,
      "reconciledBalance": 0,
      "transactionCount": 0,
      "isActive": true,
      "status": "string",
      "createdAt": "2026-07-16T16:03:02.042Z",
      "updatedAt": "2026-07-16T16:03:02.042Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "transactionAmount": 0,
    "narration": "string",
    "reconciled": true,
    "reconciledDate": "2026-07-16T16:03:02.042Z",
    "runningBalance": 0,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glStatus": "string",
    "createdAt": "2026-07-16T16:03:02.042Z",
    "updatedAt": "2026-07-16T16:03:02.042Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.042Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/bank-transactions/{id}/reconcile

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccount": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankName": "string",
      "branchName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "upiId": "string",
      "accountType": "SAVINGS",
      "openingBalance": 0,
      "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glAccountCode": "string",
      "glAccountName": "string",
      "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerAccountName": "string",
      "currentBalance": 0,
      "reconciledBalance": 0,
      "transactionCount": 0,
      "isActive": true,
      "status": "string",
      "createdAt": "2026-07-16T16:03:02.045Z",
      "updatedAt": "2026-07-16T16:03:02.045Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "transactionAmount": 0,
    "narration": "string",
    "reconciled": true,
    "reconciledDate": "2026-07-16T16:03:02.045Z",
    "runningBalance": 0,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glStatus": "string",
    "createdAt": "2026-07-16T16:03:02.045Z",
    "updatedAt": "2026-07-16T16:03:02.045Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.045Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "referenceNo": "string",
  "utrNo": "string",
  "transactionType": "DEPOSIT",
  "reconciled": true,
  "fromDate": "2026-07-16",
  "toDate": "2026-07-16",
  "minDebitAmount": 0,
  "maxDebitAmount": 0,
  "minCreditAmount": 0,
  "maxCreditAmount": 0,
  "narration": "string",
  "isDeleted": true
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "transactions": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "bankAccount": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "bankName": "string",
          "branchName": "string",
          "accountNumber": "string",
          "ifscCode": "string",
          "upiId": "string",
          "accountType": "SAVINGS",
          "openingBalance": 0,
          "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "glAccountCode": "string",
          "glAccountName": "string",
          "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "ledgerAccountName": "string",
          "currentBalance": 0,
          "reconciledBalance": 0,
          "transactionCount": 0,
          "isActive": true,
          "status": "string",
          "createdAt": "2026-07-16T16:03:02.051Z",
          "updatedAt": "2026-07-16T16:03:02.051Z",
          "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "transactionType": "DEPOSIT",
        "debitAmount": 0,
        "creditAmount": 0,
        "transactionAmount": 0,
        "narration": "string",
        "reconciled": true,
        "reconciledDate": "2026-07-16T16:03:02.051Z",
        "runningBalance": 0,
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glStatus": "string",
        "createdAt": "2026-07-16T16:03:02.051Z",
        "updatedAt": "2026-07-16T16:03:02.051Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true
      }
    ],
    "pageNumber": 0,
    "pageSize": 0,
    "totalElements": 0,
    "totalPages": 0,
    "isLast": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.051Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/bank-transactions

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "narration": "string",
    "reconciled": true
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
    "bankAccount": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "bankName": "string",
      "branchName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "upiId": "string",
      "accountType": "SAVINGS",
      "openingBalance": 0,
      "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "glAccountCode": "string",
      "glAccountName": "string",
      "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ledgerAccountName": "string",
      "currentBalance": 0,
      "reconciledBalance": 0,
      "transactionCount": 0,
      "isActive": true,
      "status": "string",
      "createdAt": "2026-07-16T16:03:02.055Z",
      "updatedAt": "2026-07-16T16:03:02.055Z",
      "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "transactionDate": "2026-07-16",
    "referenceNo": "string",
    "utrNo": "string",
    "transactionType": "DEPOSIT",
    "debitAmount": 0,
    "creditAmount": 0,
    "transactionAmount": 0,
    "narration": "string",
    "reconciled": true,
    "reconciledDate": "2026-07-16T16:03:02.055Z",
    "runningBalance": 0,
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glStatus": "string",
    "createdAt": "2026-07-16T16:03:02.055Z",
    "updatedAt": "2026-07-16T16:03:02.055Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isDeleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.055Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions/unreconciled

Parameters
Try it out
Name	Description
bankAccountId *
string($uuid)
(query)
bankAccountId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "transactions": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "bankAccount": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "bankName": "string",
          "branchName": "string",
          "accountNumber": "string",
          "ifscCode": "string",
          "upiId": "string",
          "accountType": "SAVINGS",
          "openingBalance": 0,
          "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "glAccountCode": "string",
          "glAccountName": "string",
          "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "ledgerAccountName": "string",
          "currentBalance": 0,
          "reconciledBalance": 0,
          "transactionCount": 0,
          "isActive": true,
          "status": "string",
          "createdAt": "2026-07-16T16:03:02.061Z",
          "updatedAt": "2026-07-16T16:03:02.061Z",
          "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "transactionType": "DEPOSIT",
        "debitAmount": 0,
        "creditAmount": 0,
        "transactionAmount": 0,
        "narration": "string",
        "reconciled": true,
        "reconciledDate": "2026-07-16T16:03:02.061Z",
        "runningBalance": 0,
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glStatus": "string",
        "createdAt": "2026-07-16T16:03:02.061Z",
        "updatedAt": "2026-07-16T16:03:02.061Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true
      }
    ],
    "pageNumber": 0,
    "pageSize": 0,
    "totalElements": 0,
    "totalPages": 0,
    "isLast": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.061Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions/reconciliation-summary

Parameters
Try it out
Name	Description
bankAccountId *
string($uuid)
(query)
bankAccountId
bankStatementBalance *
number
(query)
bankStatementBalance
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "accountNumber": "string",
    "bookBalance": 0,
    "bankStatementBalance": 0,
    "reconciliationDifference": 0,
    "isReconciled": true,
    "matchedTransactionCount": 0,
    "unmatchedTransactionCount": 0,
    "outstandingDeposits": 0,
    "outstandingWithdrawals": 0,
    "totalOutstanding": 0,
    "unmatchedTransactions": [
      {
        "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "narration": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "runningBalance": 0,
        "reconciled": true,
        "transactionType": "string"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.065Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions/reconciled

Parameters
Try it out
Name	Description
bankAccountId *
string($uuid)
(query)
bankAccountId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "transactions": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "bankAccount": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "bankName": "string",
          "branchName": "string",
          "accountNumber": "string",
          "ifscCode": "string",
          "upiId": "string",
          "accountType": "SAVINGS",
          "openingBalance": 0,
          "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "glAccountCode": "string",
          "glAccountName": "string",
          "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "ledgerAccountName": "string",
          "currentBalance": 0,
          "reconciledBalance": 0,
          "transactionCount": 0,
          "isActive": true,
          "status": "string",
          "createdAt": "2026-07-16T16:03:02.068Z",
          "updatedAt": "2026-07-16T16:03:02.068Z",
          "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "transactionType": "DEPOSIT",
        "debitAmount": 0,
        "creditAmount": 0,
        "transactionAmount": 0,
        "narration": "string",
        "reconciled": true,
        "reconciledDate": "2026-07-16T16:03:02.068Z",
        "runningBalance": 0,
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glStatus": "string",
        "createdAt": "2026-07-16T16:03:02.068Z",
        "updatedAt": "2026-07-16T16:03:02.068Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true
      }
    ],
    "pageNumber": 0,
    "pageSize": 0,
    "totalElements": 0,
    "totalPages": 0,
    "isLast": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.068Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions/ledger

Parameters
Try it out
Name	Description
bankAccountId *
string($uuid)
(query)
bankAccountId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "openingBalance": 0,
    "totalDebits": 0,
    "totalCredits": 0,
    "closingBalance": 0,
    "totalTransactions": 0,
    "reconciledTransactions": 0,
    "unreconciledTransactions": 0,
    "ledgerEntries": [
      {
        "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "narration": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "runningBalance": 0,
        "reconciled": true,
        "transactionType": "string"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.072Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions/ledger/date-range

Parameters
Try it out
Name	Description
bankAccountId *
string($uuid)
(query)
bankAccountId
startDate *
string($date)
(query)
startDate
endDate *
string($date)
(query)
endDate
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "openingBalance": 0,
    "totalDebits": 0,
    "totalCredits": 0,
    "closingBalance": 0,
    "totalTransactions": 0,
    "reconciledTransactions": 0,
    "unreconciledTransactions": 0,
    "ledgerEntries": [
      {
        "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "narration": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "runningBalance": 0,
        "reconciled": true,
        "transactionType": "string"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.075Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-transactions/bank-account/{bankAccountId}

Parameters
Try it out
Name	Description
bankAccountId *
string($uuid)
(path)
bankAccountId
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "transactions": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "bankAccount": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "bankName": "string",
          "branchName": "string",
          "accountNumber": "string",
          "ifscCode": "string",
          "upiId": "string",
          "accountType": "SAVINGS",
          "openingBalance": 0,
          "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "glAccountCode": "string",
          "glAccountName": "string",
          "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "ledgerAccountName": "string",
          "currentBalance": 0,
          "reconciledBalance": 0,
          "transactionCount": 0,
          "isActive": true,
          "status": "string",
          "createdAt": "2026-07-16T16:03:02.078Z",
          "updatedAt": "2026-07-16T16:03:02.078Z",
          "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "transactionType": "DEPOSIT",
        "debitAmount": 0,
        "creditAmount": 0,
        "transactionAmount": 0,
        "narration": "string",
        "reconciled": true,
        "reconciledDate": "2026-07-16T16:03:02.078Z",
        "runningBalance": 0,
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glStatus": "string",
        "createdAt": "2026-07-16T16:03:02.078Z",
        "updatedAt": "2026-07-16T16:03:02.078Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isDeleted": true
      }
    ],
    "pageNumber": 0,
    "pageSize": 0,
    "totalElements": 0,
    "totalPages": 0,
    "isLast": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:03:02.078Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
bank-account-controller


GET
/api/account/bank-accounts/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "upiId": "string",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glAccountCode": "string",
    "glAccountName": "string",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountName": "string",
    "currentBalance": 0,
    "reconciledBalance": 0,
    "transactionCount": 0,
    "isActive": true,
    "status": "string",
    "createdAt": "2026-07-16T16:10:33.598Z",
    "updatedAt": "2026-07-16T16:10:33.598Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.598Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/bank-accounts/{id}

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
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "bjh5PqtZYH6RfoHTFkRAe2a",
    "ifscCode": "gIbO0F1UCL3",
    "upiId": "GAB_r.@RBPqIfJCamDONSRgeksONrtCEqzQsQhASuEh",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
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
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "upiId": "string",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glAccountCode": "string",
    "glAccountName": "string",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountName": "string",
    "currentBalance": 0,
    "reconciledBalance": 0,
    "transactionCount": 0,
    "isActive": true,
    "status": "string",
    "createdAt": "2026-07-16T16:10:33.604Z",
    "updatedAt": "2026-07-16T16:10:33.604Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.604Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/bank-accounts/{id}

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

No links

PUT
/api/account/bank-accounts/{id}/deactivate

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "upiId": "string",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glAccountCode": "string",
    "glAccountName": "string",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountName": "string",
    "currentBalance": 0,
    "reconciledBalance": 0,
    "transactionCount": 0,
    "isActive": true,
    "status": "string",
    "createdAt": "2026-07-16T16:10:33.608Z",
    "updatedAt": "2026-07-16T16:10:33.608Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.608Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/bank-accounts/{id}/activate

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "upiId": "string",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glAccountCode": "string",
    "glAccountName": "string",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountName": "string",
    "currentBalance": 0,
    "reconciledBalance": 0,
    "transactionCount": 0,
    "isActive": true,
    "status": "string",
    "createdAt": "2026-07-16T16:10:33.611Z",
    "updatedAt": "2026-07-16T16:10:33.611Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.611Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-accounts

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "searchKey": "string",
  "bankName": "string",
  "branchName": "string",
  "accountNumber": "string",
  "ifscCode": "string",
  "upiId": "string",
  "accountTypes": [
    "SAVINGS"
  ],
  "minOpeningBalance": 0,
  "maxOpeningBalance": 0,
  "isActive": true,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdFrom": "2026-07-16T16:10:23.850Z",
  "createdTo": "2026-07-16T16:10:23.850Z",
  "updatedFrom": "2026-07-16T16:10:23.850Z",
  "updatedTo": "2026-07-16T16:10:23.850Z",
  "ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "bankAccounts": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "bankName": "string",
        "branchName": "string",
        "accountNumber": "string",
        "ifscCode": "string",
        "upiId": "string",
        "accountType": "SAVINGS",
        "openingBalance": 0,
        "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glAccountCode": "string",
        "glAccountName": "string",
        "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "ledgerAccountName": "string",
        "currentBalance": 0,
        "reconciledBalance": 0,
        "transactionCount": 0,
        "isActive": true,
        "status": "string",
        "createdAt": "2026-07-16T16:10:33.615Z",
        "updatedAt": "2026-07-16T16:10:33.615Z",
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.615Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/bank-accounts

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "wf6nAgSXuqB2XFjEwEQN3yN3Is1e3",
    "ifscCode": "zxwG0HAUI57",
    "upiId": ".NXuxfkJygPXff.tocCnEql5vu3V1J@DFqUBzyzRwxBYjUzSydwxVMmoBgiUSLbKWAVk",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
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
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "upiId": "string",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glAccountCode": "string",
    "glAccountName": "string",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountName": "string",
    "currentBalance": 0,
    "reconciledBalance": 0,
    "transactionCount": 0,
    "isActive": true,
    "status": "string",
    "createdAt": "2026-07-16T16:10:33.620Z",
    "updatedAt": "2026-07-16T16:10:33.620Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.620Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-accounts/{id}/reconciliation

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
bankStatementBalance *
number
(query)
bankStatementBalance
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "accountNumber": "string",
    "bookBalance": 0,
    "bankStatementBalance": 0,
    "reconciliationDifference": 0,
    "isReconciled": true,
    "matchedTransactionCount": 0,
    "unmatchedTransactionCount": 0,
    "outstandingDeposits": 0,
    "outstandingWithdrawals": 0,
    "totalOutstanding": 0,
    "unmatchedTransactions": [
      {
        "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "narration": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "runningBalance": 0,
        "reconciled": true,
        "transactionType": "string"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.624Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-accounts/{id}/ledger

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
  "data": {
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "openingBalance": 0,
    "totalDebits": 0,
    "totalCredits": 0,
    "closingBalance": 0,
    "totalTransactions": 0,
    "reconciledTransactions": 0,
    "unreconciledTransactions": 0,
    "ledgerEntries": [
      {
        "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "transactionDate": "2026-07-16",
        "referenceNo": "string",
        "utrNo": "string",
        "narration": "string",
        "debitAmount": 0,
        "creditAmount": 0,
        "runningBalance": 0,
        "reconciled": true,
        "transactionType": "string"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.627Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/bank-accounts/number/{accountNumber}

Parameters
Try it out
Name	Description
accountNumber *
string
(path)
accountNumber
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
    "bankName": "string",
    "branchName": "string",
    "accountNumber": "string",
    "ifscCode": "string",
    "upiId": "string",
    "accountType": "SAVINGS",
    "openingBalance": 0,
    "glAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glAccountCode": "string",
    "glAccountName": "string",
    "ledgerAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ledgerAccountName": "string",
    "currentBalance": 0,
    "reconciledBalance": 0,
    "transactionCount": 0,
    "isActive": true,
    "status": "string",
    "createdAt": "2026-07-16T16:10:33.630Z",
    "updatedAt": "2026-07-16T16:10:33.630Z",
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:10:33.630Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
ap-payment-controller


GET
/api/account/ap-payments/{id}

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "bankAccountNumber": "string",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "paymentAmount": 0,
    "tdsAmount": 0,
    "totalAllocatedAmount": 0,
    "vendorOutstandingBalance": 0,
    "paymentStatus": "UNPAID",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T16:13:29.794Z",
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0,
        "invoiceTotalAmount": 0,
        "invoiceOutstandingAmount": 0,
        "invoiceStatus": "string"
      }
    ],
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T16:13:29.794Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T16:13:29.794Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.794Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/ap-payments/{id}

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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentAmount": 0.0001,
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "tdsAmount": 0,
    "tdsPayableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocations": [
      {
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0.0001
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
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "bankAccountNumber": "string",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "paymentAmount": 0,
    "tdsAmount": 0,
    "totalAllocatedAmount": 0,
    "vendorOutstandingBalance": 0,
    "paymentStatus": "UNPAID",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T16:13:29.800Z",
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0,
        "invoiceTotalAmount": 0,
        "invoiceOutstandingAmount": 0,
        "invoiceStatus": "string"
      }
    ],
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T16:13:29.800Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T16:13:29.800Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.800Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/ap-payments/{id}

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
  "data": {
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.805Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/ap-payments/{id}/reverse

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "bankAccountNumber": "string",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "paymentAmount": 0,
    "tdsAmount": 0,
    "totalAllocatedAmount": 0,
    "vendorOutstandingBalance": 0,
    "paymentStatus": "UNPAID",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T16:13:29.807Z",
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0,
        "invoiceTotalAmount": 0,
        "invoiceOutstandingAmount": 0,
        "invoiceStatus": "string"
      }
    ],
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T16:13:29.807Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T16:13:29.807Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.807Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/ap-payments/{id}/post

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
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "bankAccountNumber": "string",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "paymentAmount": 0,
    "tdsAmount": 0,
    "totalAllocatedAmount": 0,
    "vendorOutstandingBalance": 0,
    "paymentStatus": "UNPAID",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T16:13:29.811Z",
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0,
        "invoiceTotalAmount": 0,
        "invoiceOutstandingAmount": 0,
        "invoiceStatus": "string"
      }
    ],
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T16:13:29.811Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T16:13:29.811Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.811Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/ap-payments

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentNo": "string",
  "referenceNo": "string",
  "paymentMode": "CASH",
  "paymentStatus": "UNPAID",
  "glPostingStatus": "DRAFT",
  "fromPaymentDate": "2026-07-16",
  "toPaymentDate": "2026-07-16",
  "minPaymentAmount": 0,
  "maxPaymentAmount": 0,
  "minAllocatedAmount": 0,
  "maxAllocatedAmount": 0,
  "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fromCreatedDate": "2026-07-16T16:13:22.440Z",
  "toCreatedDate": "2026-07-16T16:13:22.440Z",
  "isDeleted": true,
  "searchKeyword": "string"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
Default value : createdAt

createdAt
sortDir
string
(query)
Default value : desc

desc
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
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 0,
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyName": "string",
        "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "vendorCode": "string",
        "vendorName": "string",
        "paymentNo": "string",
        "paymentDate": "2026-07-16",
        "paymentMode": "CASH",
        "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "bankName": "string",
        "bankAccountNumber": "string",
        "referenceNo": "string",
        "chequeNumber": "string",
        "utrNumber": "string",
        "transactionId": "string",
        "chequeDate": "2026-07-16",
        "remarks": "string",
        "paymentAmount": 0,
        "tdsAmount": 0,
        "totalAllocatedAmount": 0,
        "vendorOutstandingBalance": 0,
        "paymentStatus": "UNPAID",
        "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "glPostingStatus": "string",
        "glPostingTime": "2026-07-16T16:13:29.818Z",
        "allocations": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "invoiceNo": "string",
            "allocatedAmount": 0,
            "invoiceTotalAmount": 0,
            "invoiceOutstandingAmount": 0,
            "invoiceStatus": "string"
          }
        ],
        "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "createdAt": "2026-07-16T16:13:29.818Z",
        "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "updatedAt": "2026-07-16T16:13:29.818Z"
      }
    ],
    "number": 0,
    "sort": {
      "empty": true,
      "unsorted": true,
      "sorted": true
    },
    "numberOfElements": 0,
    "pageable": {
      "offset": 0,
      "sort": {
        "empty": true,
        "unsorted": true,
        "sorted": true
      },
      "unpaged": true,
      "paged": true,
      "pageNumber": 0,
      "pageSize": 0
    },
    "empty": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.818Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/ap-payments

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentAmount": 0.0001,
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "tdsAmount": 0,
    "tdsPayableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allocations": [
      {
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "allocatedAmount": 0.0001
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
    "companyName": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "paymentNo": "string",
    "paymentDate": "2026-07-16",
    "paymentMode": "CASH",
    "bankAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankName": "string",
    "bankAccountNumber": "string",
    "referenceNo": "string",
    "chequeNumber": "string",
    "utrNumber": "string",
    "transactionId": "string",
    "chequeDate": "2026-07-16",
    "remarks": "string",
    "paymentAmount": 0,
    "tdsAmount": 0,
    "totalAllocatedAmount": 0,
    "vendorOutstandingBalance": 0,
    "paymentStatus": "UNPAID",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reverseGlJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "glPostingStatus": "string",
    "glPostingTime": "2026-07-16T16:13:29.822Z",
    "allocations": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "invoiceNo": "string",
        "allocatedAmount": 0,
        "invoiceTotalAmount": 0,
        "invoiceOutstandingAmount": 0,
        "invoiceStatus": "string"
      }
    ],
    "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdAt": "2026-07-16T16:13:29.822Z",
    "updatedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "updatedAt": "2026-07-16T16:13:29.822Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.822Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/ap-payments/ledger/{vendorId}

Parameters
Try it out
Name	Description
vendorId *
string($uuid)
(path)
vendorId
fromDate *
string($date)
(query)
fromDate
toDate *
string($date)
(query)
toDate
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
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorCode": "string",
    "vendorName": "string",
    "fromDate": "2026-07-16",
    "toDate": "2026-07-16",
    "openingBalance": 0,
    "totalInvoices": 0,
    "totalPayments": 0,
    "closingBalance": 0,
    "ledgerLines": [
      {
        "transactionDate": "2026-07-16",
        "invoiceAmount": 0,
        "paymentAmount": 0,
        "balance": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:13:29.827Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
accounting-period-controller


GET
/api/account/accounting-periods/{accountingPeriodId}

Parameters
Try it out
Name	Description
accountingPeriodId *
string($uuid)
(path)
accountingPeriodId
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
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodNumber": 0,
    "periodName": "string",
    "startDate": "2026-07-16",
    "endDate": "2026-07-16",
    "periodType": "MONTHLY",
    "status": "OPEN",
    "createdAt": "2026-07-16T16:20:47.367Z",
    "updatedAt": "2026-07-16T16:20:47.367Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.367Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/accounting-periods/{accountingPeriodId}

Parameters
Try it out
Name	Description
accountingPeriodId *
string($uuid)
(path)
accountingPeriodId
Request body

application/json
Example Value
Schema
{
  "data": {
    "periodName": "string",
    "startDate": "2026-07-16",
    "endDate": "2026-07-16"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.370Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/accounting-periods/{accountingPeriodId}

Parameters
Try it out
Name	Description
accountingPeriodId *
string($uuid)
(path)
accountingPeriodId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.373Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/accounting-periods/{fiscalYearId}

Parameters
Try it out
Name	Description
fiscalYearId *
string($uuid)
(path)
fiscalYearId
Request body

application/json
Example Value
Schema
{
  "data": {
    "periodName": "string",
    "startDate": "2026-07-16",
    "endDate": "2026-07-16"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.375Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/accounting-periods/preset

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "periodType": "MONTHLY",
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customPeriods": [
      {
        "periodName": "string",
        "startDate": "2026-07-16",
        "endDate": "2026-07-16"
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
    "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "createdCount": 0,
    "periods": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "periodNumber": 0,
        "periodName": "string",
        "startDate": "2026-07-16",
        "endDate": "2026-07-16",
        "periodType": "MONTHLY",
        "status": "OPEN",
        "createdAt": "2026-07-16T16:20:47.378Z",
        "updatedAt": "2026-07-16T16:20:47.378Z"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.378Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/account/accounting-periods/{accountingPeriodId}/toggle-status

Parameters
Try it out
Name	Description
accountingPeriodId *
string($uuid)
(path)
accountingPeriodId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.381Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/accounting-periods
Get accounting periods

Returns accounting periods for the current company for non-admin users or across all companies for system admins

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "periodName": "string",
  "isClosed": true,
  "startDateFrom": "2026-07-16",
  "startDateTo": "2026-07-16",
  "endDateFrom": "2026-07-16",
  "endDateTo": "2026-07-16",
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16",
  "updatedFrom": "2026-07-16",
  "updatedTo": "2026-07-16"
}
page
integer($int32)
(query)
Page number (0-indexed)

Default value : 0

0
size
integer($int32)
(query)
Page size

Default value : 10

10
sortBy
string
(query)
Sort field

sortBy
sortDir
string
(query)
Sort direction (ASC/DESC)

Default value : desc

desc
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
    "accountingPeriods": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fiscalYearId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "periodNumber": 0,
        "periodName": "string",
        "startDate": "2026-07-16",
        "endDate": "2026-07-16",
        "periodType": "MONTHLY",
        "status": "OPEN",
        "createdAt": "2026-07-16T16:20:47.385Z",
        "updatedAt": "2026-07-16T16:20:47.385Z"
      }
    ],
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:20:47.385Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
account-group-controller


GET
/api/account/account-groups/{accountGroupId}

Parameters
Try it out
Name	Description
accountGroupId *
string($uuid)
(path)
accountGroupId
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
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "categoryName": "string",
    "parentGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentGroupName": "string",
    "code": "string",
    "name": "string",
    "deleted": true
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:29:05.693Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/account-groups/{accountGroupId}

Parameters
Try it out
Name	Description
accountGroupId *
string($uuid)
(path)
accountGroupId
Request body

application/json
Example Value
Schema
{
  "data": {
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "string",
    "code": "string"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:29:05.696Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/account-groups/{accountGroupId}

Parameters
Try it out
Name	Description
accountGroupId *
string($uuid)
(path)
accountGroupId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:29:05.698Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/account-groups

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "name": "string",
  "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parentGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "categoryTypes": [
    "AST"
  ],
  "isDeleted": true,
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16",
  "updatedFrom": "2026-07-16",
  "updatedTo": "2026-07-16"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "data": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "categoryName": "string",
        "parentGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "parentGroupName": "string",
        "code": "string",
        "name": "string",
        "deleted": true
      }
    ],
    "paginationResponse": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:29:05.707Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/account-groups

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "parentGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "string",
    "code": "string"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:29:05.710Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/account/account-groups/{accountGroupId}/restore

Parameters
Try it out
Name	Description
accountGroupId *
string($uuid)
(path)
accountGroupId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:29:05.712Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
account-category-controller


GET
/api/account/account-categories/{accountCategoryId}

Parameters
Try it out
Name	Description
accountCategoryId *
string($uuid)
(path)
accountCategoryId
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
    "code": "string",
    "name": "string",
    "nature": "DEBIT",
    "isDeleted": true,
    "createdAt": "2026-07-16T16:32:23.945Z",
    "updatedAt": "2026-07-16T16:32:23.946Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:32:23.946Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/account/account-categories/{accountCategoryId}

Parameters
Try it out
Name	Description
accountCategoryId *
string($uuid)
(path)
accountCategoryId
Request body

application/json
Example Value
Schema
{
  "data": {
    "name": "string",
    "code": "AST"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:32:23.949Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/account/account-categories/{accountCategoryId}

Parameters
Try it out
Name	Description
accountCategoryId *
string($uuid)
(path)
accountCategoryId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:32:23.957Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/account/account-categories/{accountCategoryId}

Parameters
Try it out
Name	Description
accountCategoryId *
string($uuid)
(path)
accountCategoryId
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:32:23.959Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/account-categories

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "name": "string",
  "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "codes": [
    "AST"
  ],
  "natures": [
    "DEBIT"
  ],
  "isDeleted": true,
  "createdFrom": "2026-07-16",
  "createdTo": "2026-07-16",
  "updatedFrom": "2026-07-16",
  "updatedTo": "2026-07-16"
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
    "accountCategories": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "code": "string",
        "name": "string",
        "nature": "DEBIT",
        "isDeleted": true,
        "createdAt": "2026-07-16T16:32:23.965Z",
        "updatedAt": "2026-07-16T16:32:23.965Z"
      }
    ],
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:32:23.965Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/account-categories

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
    "name": "string",
    "code": "AST"
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
    "message": "string"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:32:23.970Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
debit-note-controller


GET
/api/account/debit-notes

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "searchKey": "string",
  "debitNoteNo": "string",
  "referenceNo": "string",
  "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "statuses": [
    "DRAFT"
  ],
  "glPostingStatuses": [
    "DRAFT"
  ],
  "minAmount": 0,
  "maxAmount": 0,
  "noteDateFrom": "2026-07-16",
  "noteDateTo": "2026-07-16"
}
pageable *
object
(query)
Example Value
Schema
{
  "page": 0,
  "size": 1,
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
      "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceNo": "string",
      "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "vendorName": "string",
      "debitNoteNo": "string",
      "noteDate": "2026-07-16",
      "amount": 0,
      "gstAmount": 0,
      "referenceNo": "string",
      "reason": "string",
      "status": "DRAFT",
      "glPostingStatus": "DRAFT",
      "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:39:19.359Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/debit-notes

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "debitNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "payableAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "purchaseReturnAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "debitNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:39:19.362Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/debit-notes/{debitNoteId}/reverse

Parameters
Try it out
Name	Description
debitNoteId *
string($uuid)
(path)
debitNoteId
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
    "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "debitNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:39:19.365Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/debit-notes/{debitNoteId}/post

Parameters
Try it out
Name	Description
debitNoteId *
string($uuid)
(path)
debitNoteId
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
    "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "debitNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:39:19.368Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/debit-notes/{debitNoteId}/cancel

Parameters
Try it out
Name	Description
debitNoteId *
string($uuid)
(path)
debitNoteId
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
    "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "debitNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:39:19.371Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/account/debit-notes/{debitNoteId}/approve

Parameters
Try it out
Name	Description
debitNoteId *
string($uuid)
(path)
debitNoteId
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
    "apInvoiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "invoiceNo": "string",
    "vendorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vendorName": "string",
    "debitNoteNo": "string",
    "noteDate": "2026-07-16",
    "amount": 0,
    "gstAmount": 0,
    "referenceNo": "string",
    "reason": "string",
    "status": "DRAFT",
    "glPostingStatus": "DRAFT",
    "glJournalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:39:19.375Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
auth-controller


POST
/api/account/auth/logout

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
/api/account/auth/verify

Parameters
Try it out
Name	Description
ACCESS_TOKEN
string
(cookie)
ACCESS_TOKEN
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
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-16T16:43:40.377Z",
    "updatedAt": "2026-07-16T16:43:40.377Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-16T16:43:40.377Z",
        "updatedAt": "2026-07-16T16:43:40.377Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-16T16:43:40.377Z",
        "updatedAt": "2026-07-16T16:43:40.377Z"
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
        "createdAt": "2026-07-16T16:43:40.377Z",
        "updatedAt": "2026-07-16T16:43:40.377Z",
        "accessTokenValidTill": "2026-07-16T16:43:40.377Z"
      }
    ]
  }
}
No links

GET
/api/account/auth/me

Parameters
Try it out
Name	Description
ACCESS_TOKEN
string
(cookie)
ACCESS_TOKEN
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
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-16T16:43:40.382Z",
    "updatedAt": "2026-07-16T16:43:40.382Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-16T16:43:40.382Z",
        "updatedAt": "2026-07-16T16:43:40.382Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-16T16:43:40.382Z",
        "updatedAt": "2026-07-16T16:43:40.382Z"
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
        "createdAt": "2026-07-16T16:43:40.382Z",
        "updatedAt": "2026-07-16T16:43:40.382Z",
        "accessTokenValidTill": "2026-07-16T16:43:40.382Z"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:43:40.382Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/auth/login

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
/api/account/auth/callback

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

trial-balance-controller


GET
/api/account/v1/reports/trial-balance
Generate Trial Balance report

Parameters
Try it out
Name	Description
fromDate
string($date)
(query)
From date (yyyy-MM-dd)

fromDate
toDate
string($date)
(query)
To date (yyyy-MM-dd)

toDate
fiscalYearId
string($uuid)
(query)
fiscalYearId
companyId
string($uuid)
(query)
companyId
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 50

50
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "rows": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "openingDebit": 0,
        "openingCredit": 0,
        "periodDebit": 0,
        "periodCredit": 0,
        "openingBalance": 0,
        "debitTotal": 0,
        "creditTotal": 0,
        "closingBalance": 0
      }
    ],
    "summary": {
      "totalOpening": 0,
      "totalDebit": 0,
      "totalCredit": 0,
      "totalClosing": 0
    },
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    },
    "generatedAt": "2026-07-16T16:49:53.636Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:49:53.636Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
profit-loss-controller


GET
/api/account/v1/reports/profit-loss
Generate Profit and Loss report

Parameters
Try it out
Name	Description
fromDate
string($date)
(query)
From date (yyyy-MM-dd)

fromDate
toDate
string($date)
(query)
To date (yyyy-MM-dd)

toDate
companyId
string($uuid)
(query)
companyId
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 50

50
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "rows": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "accountType": "string",
        "openingDebit": 0,
        "openingCredit": 0,
        "periodDebit": 0,
        "periodCredit": 0,
        "openingBalance": 0,
        "closingBalance": 0
      }
    ],
    "summary": {
      "totalRevenue": 0,
      "totalExpenses": 0,
      "grossProfit": 0,
      "netProfit": 0
    },
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    },
    "generatedAt": "2026-07-16T16:49:53.640Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:49:53.640Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
general-ledger-controller


GET
/api/account/v1/reports/general-ledger
Generate General Ledger for an account

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(query)
Company Id

companyId
accountId *
string($uuid)
(query)
Account Id

accountId
fromDate
string($date)
(query)
From date

fromDate
toDate
string($date)
(query)
To date

toDate
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 50

50
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "transactions": [
      {
        "lineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "journalEntryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "voucherDate": "2026-07-16",
        "referenceNo": "string",
        "description": "string",
        "debit": 0,
        "credit": 0,
        "runningBalance": 0
      }
    ],
    "openingBalance": 0,
    "closingBalance": 0,
    "totalDebit": 0,
    "totalCredit": 0,
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    },
    "generatedAt": "2026-07-16T16:49:53.652Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:49:53.652Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
balance-sheet-controller


GET
/api/account/v1/reports/balance-sheet
Generate Balance Sheet report

Parameters
Try it out
Name	Description
fromDate
string($date)
(query)
From date (yyyy-MM-dd)

fromDate
toDate
string($date)
(query)
To date (yyyy-MM-dd)

toDate
companyId
string($uuid)
(query)
companyId
page
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 50

50
Responses
Code	Description	Links
200	
OK

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "rows": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "accountType": "string",
        "openingDebit": 0,
        "openingCredit": 0,
        "periodDebit": 0,
        "periodCredit": 0,
        "openingBalance": 0,
        "closingBalance": 0
      }
    ],
    "summary": {
      "totalAssets": 0,
      "totalLiabilities": 0,
      "totalEquity": 0,
      "balanced": true
    },
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    },
    "generatedAt": "2026-07-16T16:49:53.656Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:49:53.656Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
report-controller


GET
/api/account/reports/trial-balance

Parameters
Try it out
Name	Description
fromDate
string($date)
(query)
fromDate
toDate
string($date)
(query)
toDate
branchId
string($uuid)
(query)
branchId
costCenterId
string($uuid)
(query)
costCenterId
projectId
string($uuid)
(query)
projectId
accountId
string($uuid)
(query)
accountId
currency
string
(query)
currency
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
    "rows": [
      {
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "accountCode": "string",
        "accountName": "string",
        "openingDebit": 0,
        "openingCredit": 0,
        "periodDebit": 0,
        "periodCredit": 0,
        "openingBalance": 0,
        "debitTotal": 0,
        "creditTotal": 0,
        "closingBalance": 0
      }
    ],
    "summary": {
      "totalOpening": 0,
      "totalDebit": 0,
      "totalCredit": 0,
      "totalClosing": 0
    },
    "pagination": {
      "page": 0,
      "size": 0,
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalElements": 0,
      "numberOfElements": 0,
      "first": true,
      "last": true,
      "hasNext": true,
      "hasPrevious": true
    },
    "generatedAt": "2026-07-16T16:49:53.661Z"
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:49:53.661Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/account/reports/trial-balance/pdf

Parameters
Try it out
Name	Description
fromDate
string($date)
(query)
fromDate
toDate
string($date)
(query)
toDate
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

No links

GET
/api/account/reports/trial-balance/excel

Parameters
Try it out
Name	Description
fromDate
string($date)
(query)
fromDate
toDate
string($date)
(query)
toDate
companyId
string($uuid)
(query)
companyId
Responses
Code	Description	Links
200	
OK

No links
cash-flow-report-controller


GET
/api/account/reports/cash-flow

Parameters
Try it out
Name	Description
startDate *
string($date)
(query)
startDate
endDate *
string($date)
(query)
endDate
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
    "startDate": "2026-07-16",
    "endDate": "2026-07-16",
    "operatingCashIn": 0,
    "operatingCashOut": 0,
    "investingCashIn": 0,
    "investingCashOut": 0,
    "financingCashIn": 0,
    "financingCashOut": 0,
    "netCashFlow": 0,
    "lines": [
      {
        "category": "string",
        "description": "string",
        "amount": 0
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:49:53.667Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}  

dashboard-finance-controller


GET
/api/account/dashboard/finance

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
    "totalReceivables": 0,
    "totalPayables": 0,
    "cashBalance": 0,
    "overdueReceivables": 0,
    "overduePayables": 0,
    "monthsOfCash": 0,
    "topCounterparties": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "amount": 0,
        "type": "string"
      }
    ],
    "recentTransactions": [
      {
        "referenceNo": "string",
        "type": "string",
        "counterparty": "string",
        "amount": 0,
        "status": "string"
      }
    ]
  },
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:53:02.355Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
audit-log-controller


GET
/api/account/audit-logs

Parameters
Try it out
Name	Description
filter *
object
(query)
Example Value
Schema
{
  "moduleName": "string",
  "entityName": "string",
  "entityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "actionType": "string",
  "performedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fromDate": "2026-07-16T16:53:00.728Z",
  "toDate": "2026-07-16T16:53:00.728Z",
  "ipAddress": "string",
  "isDeleted": true
}
page
integer($int32)
(query)
Default value : 0

0
size
integer($int32)
(query)
Default value : 10

10
sortBy
string
(query)
sortBy
sortDir
string
(query)
Default value : desc

desc
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
      "moduleName": "string",
      "entityName": "string",
      "entityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "actionType": "string",
      "oldValue": "string",
      "newValue": "string",
      "performedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "performedAt": "2026-07-16T16:53:02.369Z",
      "ipAddress": "string",
      "userAgent": "string"
    }
  ],
  "errors": [
    "string"
  ],
  "status": 0,
  "timestamp": "2026-07-16T16:53:02.369Z",
  "pagination": {
    "page": 0,
    "size": 0,
    "currentPage": 0,
    "pageSize": 0,
    "totalPages": 0,
    "totalElements": 0,
    "numberOfElements": 0,
    "first": true,
    "last": true,
    "hasNext": true,
    "hasPrevious": true
  },
  "metadata": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

