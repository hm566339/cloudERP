auth-controller


GET
/api/sso/portal-access/{companyId}

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 5

5
search
string
(query)
search
status
boolean
(query)

--
companyId *
string($uuid)
(path)
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
    "portalAccesses": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.189Z",
        "updatedAt": "2026-07-17T04:48:58.189Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

GET
/api/sso/authorize

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
user_id *
string($uuid)
(query)
user_id
module_id *
string($uuid)
(query)
module_id
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/sso/auth/me

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
Responses
Code	Description	Links
200	
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
    "createdAt": "2026-07-17T04:48:58.192Z",
    "updatedAt": "2026-07-17T04:48:58.192Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.192Z",
        "updatedAt": "2026-07-17T04:48:58.192Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.192Z",
        "updatedAt": "2026-07-17T04:48:58.192Z"
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
        "createdAt": "2026-07-17T04:48:58.192Z",
        "updatedAt": "2026-07-17T04:48:58.192Z",
        "accessTokenValidTill": "2026-07-17T04:48:58.192Z"
      }
    ]
  }
}
No links

POST
/api/sso/token/verify

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
Responses
Code	Description	Links
200	
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
      "createdAt": "2026-07-17T04:48:58.194Z",
      "updatedAt": "2026-07-17T04:48:58.194Z",
      "role": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string",
          "status": true,
          "createdAt": "2026-07-17T04:48:58.194Z",
          "updatedAt": "2026-07-17T04:48:58.194Z"
        }
      ],
      "portalAccess": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "username": "string",
          "moduleName": "string",
          "host": "string",
          "status": true,
          "createdAt": "2026-07-17T04:48:58.194Z",
          "updatedAt": "2026-07-17T04:48:58.194Z"
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
          "createdAt": "2026-07-17T04:48:58.194Z",
          "updatedAt": "2026-07-17T04:48:58.194Z",
          "accessTokenValidTill": "2026-07-17T04:48:58.194Z"
        }
      ]
    }
  }
}
No links

POST
/api/sso/token/revoke

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "token": "string",
    "tokenType": "string",
    "clientSecret": "string"
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/sso/token/refresh

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "refreshToken": "string",
    "clientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 0
  }
}
No links

POST
/api/sso/token/exchange

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "code": "string",
    "clientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "clientSecret": "string"
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
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyCode": "string",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-17T04:48:58.199Z",
    "updatedAt": "2026-07-17T04:48:58.199Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.199Z",
        "updatedAt": "2026-07-17T04:48:58.199Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.199Z",
        "updatedAt": "2026-07-17T04:48:58.199Z"
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
        "createdAt": "2026-07-17T04:48:58.199Z",
        "updatedAt": "2026-07-17T04:48:58.199Z",
        "accessTokenValidTill": "2026-07-17T04:48:58.199Z"
      }
    ]
  },
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 0
}
No links

POST
/api/sso/auth/register

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "empId": "string",
    "username": "HWMQU4.m.Xyoy2pF8BIO",
    "email": "user@example.com",
    "role": "string",
    "module": "string",
    "password": "o4T(h~OrlCbWeuQ^M5\"M*`2nj[T=KN`$B$]7){7O;=nfAB6G4|",
    "companyCode": "string",
    "fullName": "string"
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
    "companyCode": "string",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-17T04:48:58.202Z",
    "updatedAt": "2026-07-17T04:48:58.202Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.202Z",
        "updatedAt": "2026-07-17T04:48:58.202Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T04:48:58.202Z",
        "updatedAt": "2026-07-17T04:48:58.202Z"
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
        "createdAt": "2026-07-17T04:48:58.202Z",
        "updatedAt": "2026-07-17T04:48:58.202Z",
        "accessTokenValidTill": "2026-07-17T04:48:58.202Z"
      }
    ]
  }
}
No links

POST
/api/sso/auth/logout

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/sso/auth/login

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "username": "xGUq._xPwECNf@AL-rjIdk5-74Bg5V1uyXvyCfhABn3Q708x14WHkMOD6FnArBOajwcFTSmlTvJNENkDRaT.IUruVklWkGDPnwlqbANRoDVFPwiVvbZPSAJZLOTVrKMPNuCapTmIbdDtSenqqzvbBVBouIDrvDHBDfbYAWescBvBwvw",
    "password": "ljL{{(i<~_^N_KyQ3E\"J|P\"see{l]hZ 7MF(!=VK_9`Ru!s:nX",
    "host": "https://OBR7O<&i*0`fElvFa#mya&r]]=Rp6~c2;</T9p@3gQZfBgNs.Ee3c0E\\xfA&!R;Eh0gf?UCMMushMZ03.1",
    "companyCode": "string"
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
    "accessToken": "string",
    "refreshToken": "string",
    "message": "string",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "accountStatus": "string"
    },
    "redirectUrl": "string"
  }
}
No links

POST
/api/sso/auth/admin-login

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "username": "vSD_Slwap9R.xDHNNDxNKpc18%l%X01fWvG3vL_DnOOahoijgvWTAe7Fnr56DdAHC2-q57B8V.L-ABH92xs+Pq8K8@g3FQZobUcFZ.eWgTFSSRwJWQPaSjoaLnPWxNcXkRGzuASRnbHbisabzLkLJgpJQcoipyuqVilTAR",
    "password": "6]+o)dhzuEZ(>=rn'oZ$75g_yy>{~9)81e=n-3G*iy}j{D6%e,",
    "host": "https://9jh`<8y>y*AsnA@w",
    "companyCode": "string"
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
  "accessToken": "string",
  "refreshToken": "string",
  "message": "string",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "accountStatus": "string"
  },
  "redirectUrl": "string"
}
No links

POST
/api/sso/admin/token/refresh

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "refreshToken": "string"
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
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 0
  }
}
No links
company-controller


DELETE
/api/sso/company/{id}

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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/sso/company/{id}

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
    "companyCode": "string",
    "companyName": "string",
    "legalName": "string",
    "companyType": "string",
    "gstin": "string",
    "pan": "string",
    "email": "string",
    "phone": "string",
    "website": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "logoUrl": "string",
    "active": true,
    "createdAt": "2026-07-17T05:16:50.449Z",
    "updatedAt": "2026-07-17T05:16:50.449Z"
  }
}
No links

GET
/api/sso/company

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 4

4
search
string
(query)
search
active
boolean
(query)

--
Responses
Code	Description	Links
200	
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
    "companies": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyCode": "string",
        "companyName": "string",
        "legalName": "string",
        "companyType": "string",
        "gstin": "string",
        "pan": "string",
        "email": "string",
        "phone": "string",
        "website": "string",
        "addressLine1": "string",
        "addressLine2": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postalCode": "string",
        "logoUrl": "string",
        "active": true,
        "createdAt": "2026-07-17T05:16:50.453Z",
        "updatedAt": "2026-07-17T05:16:50.453Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

GET
/api/sso/company/open

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
      "companyCode": "string",
      "companyName": "string"
    }
  ]
}
No links

GET
/api/sso/company/code/{companyCode}

Parameters
Try it out
Name	Description
companyCode *
string
(path)
companyCode
Responses
Code	Description	Links
200	
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
    "companyName": "string",
    "legalName": "string",
    "companyType": "string",
    "gstin": "string",
    "pan": "string",
    "email": "string",
    "phone": "string",
    "website": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "logoUrl": "string",
    "active": true,
    "createdAt": "2026-07-17T05:16:50.457Z",
    "updatedAt": "2026-07-17T05:16:50.457Z"
  }
}
No links

PATCH
/api/sso/company/{id}/status

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
active *
boolean
(query)

--
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/sso/company

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
Request body

application/json
Example Value
Schema
{
  "data": {
    "companyCode": "string",
    "companyName": "string",
    "modulesid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "legalName": "string",
    "companyType": "string",
    "gstin": "string",
    "pan": "string",
    "email": "user@example.com",
    "phone": "019186797060520",
    "website": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "baseCurrency": "str",
    "postalCode": "string",
    "logoUrl": "string",
    "active": true
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/sso/company/{id}

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
    "companyCode": "string",
    "companyName": "string",
    "modulesid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "legalName": "string",
    "companyType": "string",
    "gstin": "string",
    "pan": "string",
    "email": "user@example.com",
    "phone": "33692667844194",
    "website": "string",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "baseCurrency": "str",
    "postalCode": "string",
    "logoUrl": "string",
    "active": true
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
company-module-controller


DELETE
/api/sso/company-modules/{id}

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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/sso/company-modules/{id}

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
    "company": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "companyCode": "string",
      "companyName": "string",
      "legalName": "string",
      "companyType": "string",
      "gstin": "string",
      "pan": "string",
      "email": "string",
      "phone": "string",
      "website": "string",
      "addressLine1": "string",
      "addressLine2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "logoUrl": "string",
      "active": true,
      "createdAt": "2026-07-17T05:23:08.094Z",
      "updatedAt": "2026-07-17T05:23:08.094Z"
    },
    "module": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "host": "string",
      "clientId": "string",
      "moduleStatus": true,
      "createdAt": "2026-07-17T05:23:08.094Z",
      "updatedAt": "2026-07-17T05:23:08.094Z"
    },
    "active": true,
    "createdAt": "2026-07-17T05:23:08.094Z",
    "updatedAt": "2026-07-17T05:23:08.094Z"
  }
}
No links

GET
/api/sso/company-modules

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 4

4
active
boolean
(query)

--
Responses
Code	Description	Links
200	
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
    "companyModuleResponse": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "company": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "companyCode": "string",
          "companyName": "string",
          "legalName": "string",
          "companyType": "string",
          "gstin": "string",
          "pan": "string",
          "email": "string",
          "phone": "string",
          "website": "string",
          "addressLine1": "string",
          "addressLine2": "string",
          "city": "string",
          "state": "string",
          "country": "string",
          "postalCode": "string",
          "logoUrl": "string",
          "active": true,
          "createdAt": "2026-07-17T05:23:08.102Z",
          "updatedAt": "2026-07-17T05:23:08.102Z"
        },
        "module": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string",
          "host": "string",
          "clientId": "string",
          "moduleStatus": true,
          "createdAt": "2026-07-17T05:23:08.102Z",
          "updatedAt": "2026-07-17T05:23:08.102Z"
        },
        "active": true,
        "createdAt": "2026-07-17T05:23:08.102Z",
        "updatedAt": "2026-07-17T05:23:08.102Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

GET
/api/sso/company-modules/company/{companyId}

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(path)
companyId
active
boolean
(query)

--
Responses
Code	Description	Links
200	
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
      "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "host": "string",
      "name": "string",
      "status": true,
      "createdAt": "2026-07-17T05:23:08.104Z",
      "updatedAt": "2026-07-17T05:23:08.104Z"
    }
  ]
}
No links

PATCH
/api/sso/company-modules/{id}/status

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
active *
boolean
(query)

--
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/sso/company-modules

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "company": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "module": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/sso/company-modules/{id}

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
    "company": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "module": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "active": true
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links
dashboard-controller


GET
/api/sso/dashboard/{companyId}

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(path)
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
    "companyName": "string",
    "modules": {
      "total": 0,
      "active": 0,
      "inactive": 0
    },
    "roles": {
      "total": 0,
      "items": [
        {
          "roleName": "string",
          "assignedUsers": 0
        }
      ]
    },
    "users": {
      "total": 0,
      "active": 0,
      "inactive": 0,
      "blocked": 0,
      "unverified": 0
    },
    "sessions": {
      "total": 0,
      "active": 0,
      "expired": 0
    },
    "portalAccess": {
      "total": 0,
      "active": 0,
      "inactive": 0,
      "items": [
        {
          "moduleName": "string",
          "grantedUsers": 0
        }
      ]
    },
    "authorizationCodes": {
      "total": 0,
      "active": 0,
      "used": 0,
      "expired": 0
    }
  }
}
No links
module-controller


DELETE
/api/sso/module/{id}

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
  }
}
No links

GET
/api/sso/module/{id}

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
    "name": "string",
    "host": "string",
    "clientSecret": "string",
    "clientId": "string",
    "moduleStatus": true,
    "createdAt": "2026-07-17T05:27:19.775Z",
    "updatedAt": "2026-07-17T05:27:19.775Z"
  }
}
No links

GET
/api/sso/module

Parameters
Try it out
Name	Description
status
boolean
(query)

--
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 4

4
search
string
(query)
search
Responses
Code	Description	Links
200	
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
    "modules": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "host": "string",
        "clientSecret": "string",
        "clientId": "string",
        "moduleStatus": true,
        "createdAt": "2026-07-17T05:27:19.780Z",
        "updatedAt": "2026-07-17T05:27:19.780Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

PATCH
/api/sso/module/{id}/status

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
    "moduleStatus": true
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
    "moduleStatus": true,
    "updatedAt": "2026-07-17T05:27:19.784Z"
  }
}
No links

POST
/api/sso/module

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "name": "string",
    "host": "https://,EWt\"j7L^QY_H|MaF%`Tu{Z-mI;u 8qEe&rjr8Ve$?Mfw({{&K5K>`v)=F4"
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
    "name": "string",
    "host": "string",
    "clientId": "string",
    "clientSecret": "string",
    "moduleStatus": true
  }
}
No links

POST
/api/sso/module/{id}/rotatesecret

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
    "clientId": "string",
    "clientSecret": "string"
  }
}
No links

PUT
/api/sso/module/{id}

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
    "name": "string",
    "host": "https://xxvw2Z0w9@CW,SGh/G$<z> WgkZzR%v+l}"
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
    "name": "string",
    "host": "string",
    "clientId": "string",
    "moduleStatus": true,
    "createdAt": "2026-07-17T05:27:19.793Z",
    "updatedAt": "2026-07-17T05:27:19.793Z"
  }
}
No links
module-route-controller


DELETE
/api/sso/module-routes/{id}

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
  }
}
No links

GET
/api/sso/module-routes/{id}

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
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "moduleName": "string",
    "apiPattern": "string",
    "serviceUrl": "string",
    "routeOrder": 0,
    "active": true
  }
}
No links

GET
/api/sso/module-routes

Parameters
Try it out
Name	Description
active
boolean
(query)

--
moduleId
string($uuid)
(query)
moduleId
page
integer($int32)
(query)
Default value : 1

1
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
    "moduleRoutes": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "moduleName": "string",
        "apiPattern": "string",
        "serviceUrl": "string",
        "routeOrder": 0,
        "active": true
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

GET
/api/sso/module-routes/internal/routes

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
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "moduleName": "string",
    "apiPattern": "string",
    "serviceUrl": "string",
    "routeOrder": 0,
    "active": true
  }
]
No links

PATCH
/api/sso/module-routes/{id}/status

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
    "active": true
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
  }
}
No links

POST
/api/sso/module-routes

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "data": {
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "apiPattern": "string",
    "serviceUrl": "string",
    "routeOrder": 0,
    "active": true
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
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "moduleName": "string",
    "apiPattern": "string",
    "serviceUrl": "string",
    "routeOrder": 0,
    "active": true
  }
}
No links

PUT
/api/sso/module-routes/{id}

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
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "apiPattern": "string",
    "serviceUrl": "string",
    "routeOrder": 0,
    "active": true
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
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "moduleName": "string",
    "apiPattern": "string",
    "serviceUrl": "string",
    "routeOrder": 0,
    "active": true
  }
}
No links
role-controller


DELETE
/api/sso/role/{id}

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
  "data": "string"
}
No links

GET
/api/sso/role/{id}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 4

4
search
string
(query)
search
status
boolean
(query)

--
Responses
Code	Description	Links
200	
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
    "name": "string",
    "status": true,
    "createdAt": "2026-07-17T05:47:30.111Z",
    "updatedAt": "2026-07-17T05:47:30.111Z",
    "users": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "empId": "string",
        "username": "string",
        "email": "string",
        "fullName": "string",
        "accountStatus": "string"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

GET
/api/sso/role

Parameters
Try it out
Name	Description
status
boolean
(query)

--
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 4

4
search
string
(query)
search
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
    "roles": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T05:47:30.114Z",
        "updatedAt": "2026-07-17T05:47:30.114Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

PATCH
/api/sso/role/{id}/status

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
status *
boolean
(query)

--
Responses
Code	Description	Links
200	
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
    "name": "string",
    "status": true,
    "createdAt": "2026-07-17T05:47:30.117Z",
    "updatedAt": "2026-07-17T05:47:30.117Z"
  }
}
No links

POST
/api/sso/role

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
    "name": "QFYSSGOB_AEI_PUCHTQZ",
    "status": true
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
    "name": "string",
    "status": true,
    "createdAt": "2026-07-17T05:47:30.119Z",
    "updatedAt": "2026-07-17T05:47:30.119Z"
  }
}
No links

PUT
/api/sso/role/{id}

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
    "name": "TRCNCSPKJJABJRSUYTEW",
    "status": true
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
    "name": "string",
    "status": true,
    "createdAt": "2026-07-17T05:47:30.123Z",
    "updatedAt": "2026-07-17T05:47:30.123Z"
  }
}


session-controller


DELETE
/api/sso/session/{id}

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/sso/session/all

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
force
boolean
(query)
Default value : false


false
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/sso/session/admin/{id}

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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/sso/session/sso/refresh

Parameters
Try it out
Name	Description
refresh_token
string
(cookie)
refresh_token
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{}
No links

GET
/api/sso/session/sso/callback

Parameters
Try it out
Name	Description
code
string
(query)
code
goto
string
(query)
goto
Responses
Code	Description	Links
200	
OK

No links

GET
/api/sso/session/my

Parameters
Try it out
Name	Description
Authorization *
string
(header)
Authorization
Responses
Code	Description	Links
200	
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
    "sessions": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "ipAddress": "string",
        "userAgent": "string",
        "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "moduleName": "string",
        "createdAt": "2026-07-17T05:52:22.042Z",
        "updatedAt": "2026-07-17T05:52:22.042Z",
        "accessTokenValidTill": "2026-07-17T05:52:22.042Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

GET
/api/sso/session/all/{companyId}

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(path)
companyId
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 4

4
Responses
Code	Description	Links
200	
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
    "sessions": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "ipAddress": "string",
        "userAgent": "string",
        "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "moduleName": "string",
        "createdAt": "2026-07-17T05:52:22.046Z",
        "updatedAt": "2026-07-17T05:52:22.046Z",
        "accessTokenValidTill": "2026-07-17T05:52:22.046Z"
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

POST
/api/sso/session/sso/logout

Parameters
Try it out
Name	Description
access_token
string
(cookie)
access_token
Responses
Code	Description	Links
200	
OK

No links
user-controller


DELETE
/api/sso/user/{id}

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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/sso/user/{id}/role/{roleId}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
roleId *
string($uuid)
(path)
roleId
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

DELETE
/api/sso/user/{id}/portalaccess/{moduleId}

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
moduleId *
string($uuid)
(path)
moduleId
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/sso/user/{id}

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
    "companyCode": "string",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-17T05:57:24.408Z",
    "updatedAt": "2026-07-17T05:57:24.408Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.408Z",
        "updatedAt": "2026-07-17T05:57:24.408Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.408Z",
        "updatedAt": "2026-07-17T05:57:24.408Z"
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
        "createdAt": "2026-07-17T05:57:24.408Z",
        "updatedAt": "2026-07-17T05:57:24.408Z",
        "accessTokenValidTill": "2026-07-17T05:57:24.408Z"
      }
    ]
  }
}
No links

GET
/api/sso/user/verify-email

Parameters
Try it out
Name	Description
token *
string
(query)
token
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

GET
/api/sso/user/company/{companyId}

Parameters
Try it out
Name	Description
page
integer($int32)
(query)
Default value : 1

1
pageSize
integer($int32)
(query)
Default value : 5

5
search
string
(query)
search
status
string
(query)
status
role
string
(query)
role
companyId *
string($uuid)
(path)
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
    "users": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyCode": "string",
        "empId": "string",
        "username": "string",
        "email": "string",
        "fullName": "string",
        "emailStatus": "VERIFIED",
        "accountStatus": "ACTIVE",
        "createdAt": "2026-07-17T05:57:24.420Z",
        "updatedAt": "2026-07-17T05:57:24.420Z",
        "role": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "name": "string",
            "status": true,
            "createdAt": "2026-07-17T05:57:24.420Z",
            "updatedAt": "2026-07-17T05:57:24.420Z"
          }
        ],
        "portalAccess": [
          {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "username": "string",
            "moduleName": "string",
            "host": "string",
            "status": true,
            "createdAt": "2026-07-17T05:57:24.420Z",
            "updatedAt": "2026-07-17T05:57:24.420Z"
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
            "createdAt": "2026-07-17T05:57:24.420Z",
            "updatedAt": "2026-07-17T05:57:24.420Z",
            "accessTokenValidTill": "2026-07-17T05:57:24.420Z"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 0,
      "pageSize": 0,
      "totalPages": 0,
      "totalCount": 0
    }
  }
}
No links

PATCH
/api/sso/user/{userId}/verify-email

Parameters
Try it out
Name	Description
userId *
string($uuid)
(path)
userId
status *
string
(query)
Available values : VERIFIED, UNVERIFIED


VERIFIED
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": "VERIFIED"
}
No links

PATCH
/api/sso/user/{userId}/portal/{moduleId}/toggle

Parameters
Try it out
Name	Description
userId *
string($uuid)
(path)
userId
moduleId *
string($uuid)
(path)
moduleId
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PATCH
/api/sso/user/{id}/status

Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
status *
string
(query)
Available values : ACTIVE, INACTIVE, BLOCKED


ACTIVE
Responses
Code	Description	Links
200	
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
    "createdAt": "2026-07-17T05:57:24.437Z",
    "updatedAt": "2026-07-17T05:57:24.437Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.437Z",
        "updatedAt": "2026-07-17T05:57:24.437Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.437Z",
        "updatedAt": "2026-07-17T05:57:24.437Z"
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
        "createdAt": "2026-07-17T05:57:24.437Z",
        "updatedAt": "2026-07-17T05:57:24.437Z",
        "accessTokenValidTill": "2026-07-17T05:57:24.437Z"
      }
    ]
  }
}
No links

POST
/api/sso/user

Parameters
Try it out
Name	Description
companyId *
string($uuid)
(query)
companyId
module *
string($uuid)
(query)
module
Request body

application/json
Example Value
Schema
{
  "data": {
    "empId": "string",
    "username": "k6bqY3pen0KCZg5UWOzg",
    "email": "user@example.com",
    "fullName": "string"
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
    "companyCode": "string",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-17T05:57:24.444Z",
    "updatedAt": "2026-07-17T05:57:24.444Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.444Z",
        "updatedAt": "2026-07-17T05:57:24.444Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.444Z",
        "updatedAt": "2026-07-17T05:57:24.444Z"
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
        "createdAt": "2026-07-17T05:57:24.444Z",
        "updatedAt": "2026-07-17T05:57:24.444Z",
        "accessTokenValidTill": "2026-07-17T05:57:24.444Z"
      }
    ]
  }
}
No links

POST
/api/sso/user/{id}/role

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
    "roleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "roleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "assignedAt": "2026-07-17T05:57:24.449Z"
  }
}
No links

POST
/api/sso/user/{id}/portal-access

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
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "moduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": true,
    "createdAt": "2026-07-17T05:57:24.452Z"
  }
}
No links

POST
/api/sso/user/{id}/change-password

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
    "currentPassword": "=xD }0jI?qX%O<)JnVJ[Dl]8ZBeTzS8U?=j'Py_v,&}bf(Y2Fo",
    "newPassword": "n;%Lo\"b80%vaYL;@[HkeAWazy"
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/sso/user/reset-password

Parameters
Try it out
Name	Description
token *
string
(query)
token
Request body

application/json
Example Value
Schema
{
  "data": {
    "password": "gk|TGxIS5(Z?i8&Bk_*E&{Hr`0NT M;oEti!\"_!d,D@ET-,}Zq"
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

POST
/api/sso/user/forgot-password

Parameters
Try it out
Name	Description
email *
string
(query)
email
companyCode *
string
(query)
companyCode
Responses
Code	Description	Links
200	
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
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
No links

PUT
/api/sso/user/{id}

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
    "empId": "string",
    "username": "iSGSaxmZDO",
    "email": "user@example.com",
    "fullName": "string"
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
    "companyCode": "string",
    "empId": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "emailStatus": "VERIFIED",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-07-17T05:57:24.471Z",
    "updatedAt": "2026-07-17T05:57:24.471Z",
    "role": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.471Z",
        "updatedAt": "2026-07-17T05:57:24.471Z"
      }
    ],
    "portalAccess": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "username": "string",
        "moduleName": "string",
        "host": "string",
        "status": true,
        "createdAt": "2026-07-17T05:57:24.471Z",
        "updatedAt": "2026-07-17T05:57:24.471Z"
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
        "createdAt": "2026-07-17T05:57:24.471Z",
        "updatedAt": "2026-07-17T05:57:24.471Z",
        "accessTokenValidTill": "2026-07-17T05:57:24.471Z"
      }
    ]
  }
}
No links