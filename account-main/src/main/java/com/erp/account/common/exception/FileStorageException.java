package com.erp.account.common.exception;

public class FileStorageException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public FileStorageException(String message) {
        super(message, "FILE_STORAGE_ERROR");
    }

    public FileStorageException(String message, String errorCode) {
        super(message, errorCode);
    }

    public FileStorageException(String message, Throwable cause) {
        super(message, cause, "FILE_STORAGE_ERROR");
    }
}
