(function () {
    'use strict';

    angular
        .module('app')
        .factory('securityService', securityService);

    //securityService.$inject = [];

    function securityService() {
        var service = {
            hideData: hideData,
            getHiddenData: getHiddenData,
            isValidHiddenData: isValidHiddenData,
            setKey: setKey
        },
        obfuscationKey = null;

        return service;

        //obfuscates the given string
        function hideData(data) {
            if (obfuscationKey === null) {
                setKey();   //ensure the key is set before hiding the data
            }
            return ("00" + obfuscationKey.length.toString(16)).slice(-2) +
                        keyRotate(obfuscationKey,
                            window.location.hostname) +
                        keyRotate(data.split('').reverse().join(''),
                            obfuscationKey);
        }
        //unobfuscates the given string
        function getHiddenData(data) {
            var keyLength = parseInt(data.substring(0, 2), 16),
                str = keyRotate(
                            data.substring(keyLength + 2),
                            keyRotate(data.substring(2, keyLength + 2),
                                window.location.hostname,
                                true),
                            true);
            return str.split("").reverse().join("");
        }
        //checks the "header" information for markers
        function isValidHiddenData(data) {
            var isValid = false,
                keyLength;
            if (data.length > 3) {  //2 characters for the key length and at least one character for the key
                try {
                    keyLength = parseInt(data.substring(0, 2), 16);
                    if (!isNaN(keyLength) && keyLength > 0 && data.length > keyLength + 2) {  //at least 1 character beyond the 2-digit hex value and key
                        isValid = true;
                    }
                } catch (e) {
                    //
                }
            }
            return isValid;
        }
        //set the obfuscationkey value
        function setKey(key) {
            var maxLen = 255;
            if (key) {
                obfuscationKey = (key.length > maxLen ? key.substring(0, maxLen) : key);  //default key is defined by caller
            } else {
                var loc = window.location.hostname;
                obfuscationKey = (loc.length > maxLen ? loc.substring(0, maxLen) : loc);  //default key is the current hostname
            }
        }

        function keyRotate(text, key, reverse) {
            // Surrogate pair limit
            var bound = 0x10000;
            // Create string from character codes
            return String.fromCharCode.apply(null,
                // Turn string to character codes
                text.split('').map(function (v, i) {
                    // Get rotation from key
                    var rotation = key[i % key.length].charCodeAt();

                    // Are we decrypting?
                    if (reverse) { rotation = -rotation; }

                    // Return current character code + rotation
                    return (v.charCodeAt() + rotation + bound) % bound;
                })
            );
        }
    }
})();