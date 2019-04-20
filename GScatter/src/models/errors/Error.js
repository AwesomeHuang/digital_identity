import * as ErrorTypes from './ErrorTypes'

export const ErrorCodes = {
    NO_SIGNATURE: 402,
    FORBIDDEN: 403,
    TIMED_OUT: 408,
    LOCKED: 423,
    UPGRADE_REQUIRED: 426,
    TOO_MANY_REQUESTS: 429,
    ENCRYPT_MEMO_ERROR: 430,
    BUILD_DISPLAY_MESSAGE_ERROR: 431,
    NO_PERMISSION: 432,
    UN_DEF_ERROR: 433
};

export default class Error {

    constructor(_type = ErrorTypes.UN_DEF_ERROR, _message, _code = ErrorCodes.UN_DEF_ERROR, originalError) {
        this.type = _type;
        this.message = _message;
        this.code = _code;
        this.isError = true;
        this.originalError = originalError;
    }

    static locked() {
        return new Error(ErrorTypes.LOCKED, "The user's Scatter is locked. They have been notified and should unlock before continuing.")
    }

    static promptClosedWithoutAction() {
        return new Error(ErrorTypes.PROMPT_CLOSED, "The user closed the prompt without any action.", ErrorCodes.TIMED_OUT)
    }

    static maliciousEvent() {
        return new Error(ErrorTypes.MALICIOUS, "Malicious event discarded.", ErrorCodes.FORBIDDEN)
    }

    static signatureError(_type, _message) {
        return new Error(_type, _message, ErrorCodes.NO_SIGNATURE)
    }

    static requiresUpgrade() {
        return new Error(ErrorTypes.UPGRADE_REQUIRED, "The required version is newer than the User's Scatter", ErrorCodes.UPGRADE_REQUIRED)
    }

    static identityMissing() {
        return this.signatureError("identity_missing", "Identity no longer exists on the user's keychain");
    }

    static signatureAccountMissing() {
        return this.signatureError("account_missing", "Missing required accounts, repull the identity");
    }

    static malformedRequiredFields() {
        return this.signatureError("malformed_requirements", "The requiredFields you passed in were malformed");
    }

    static noNetwork() {
        return this.signatureError("no_network", "You must bind a network first");
    }

    static usedKeyProvider() {
        return new Error(
            ErrorTypes.MALICIOUS,
            "Do not use a `keyProvider` with a Scatter. Use a `signProvider` and return only signatures to this object. A malicious person could retrieve your keys otherwise.",
            ErrorCodes.NO_SIGNATURE
        )
    }

    static encryptMemoError(message) {
        return new Error(
            ErrorTypes.ENCRYPT_MEMO_ERROR,
            message,
            ErrorCodes.ENCRYPT_MEMO_ERROR
        )
    }

    static buildDisplayMessageError(message) {
        return new Error(
            ErrorTypes.BUILD_DISPLAY_MESSAGE_ERROR,
            message,
            ErrorCodes.BUILD_DISPLAY_MESSAGE_ERROR
        )
    }

    static noPermissionError(msg = 'Haven\'t authorize yet' ) {
        return new Error(
            ErrorTypes.NO_PERMISSION,
            msg,
            ErrorCodes.NO_PERMISSION
        )
    }
}