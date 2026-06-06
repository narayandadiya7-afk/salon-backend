// Enums for Return Codes
export enum eReturnCodes {
  R_SUCCESS = 0,
  R_DB_ERROR = 1,
  R_NOT_FOUND = 2,
  R_AUTHENTICATION_FAILED = 3,
  R_DUPLICATE_DATA = 4,
  R_UNAUTHORIZED = 5,
  R_CREATED = 6,
  R_INVALID_DATA = 7,
  R_INVALID_REQUEST = 8,
}

export enum eSourcePlatform {
  PORTAL = 1,
  WEBSITE = 2,
  MOBILE = 3,
}

export enum eBoolean {
  FALSE = 0,
  TRUE = 1,
}

export enum eRoles {
  ADMIN = 1,
  SALON_OWNER = 2,
  STAFF = 3,
  USER = 4,
}
