// cryptoUtils.js   
import CryptoES from 'crypto-es';
import { secretKey } from '../constants';

const encrypt = (text) => {
  const encryptedId = CryptoES.AES.encrypt(text, secretKey).toString();

  return encryptedId;
};

const decrypt = (cipherText) => {
  const plainText = CryptoES.AES.decrypt(cipherText, secretKey).toString(CryptoES.enc.Utf8);

  return plainText;
};

export { encrypt, decrypt };
