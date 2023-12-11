package heartbeat.util;

import heartbeat.exception.DecryptDataOrPasswordException;
import heartbeat.exception.EncryptDecryptProcessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class EncryptDecryptUtil {

	public static final String SHA_256 = "SHA256";

	private static final String BACKEND_SECRET_KEY = "BACKEND_SECRET_KEY";

	private static final String FIXED_SALT = "FIXED_SALT";

	public static final String AES_CBC_PADDING = "AES/CBC/PKCS5Padding";

	public static final String HMAC_SHA_256 = "HmacSHA256";

	public static final int RANDOM_IV_BYTE_SIZE = 16;

	public static final int IV_STRING_SIZE = 32;

	public static final int MAC_BYTES_STRING_SIZE = 44;

	public final SystemUtil systemUtil;

	public String cutIvFromEncryptedData(String encryptedConfigData) {
		return encryptedConfigData.substring(0, IV_STRING_SIZE);
	}

	public String cutDataFromEncryptedData(String encryptedConfigData) {
		return encryptedConfigData.substring(IV_STRING_SIZE, encryptedConfigData.length() - MAC_BYTES_STRING_SIZE);
	}

	public String cutMacBytesFromEncryptedData(String encryptedConfigData) {
		return encryptedConfigData.substring(encryptedConfigData.length() - MAC_BYTES_STRING_SIZE);
	}

	public String getRandomIv() {
		SecureRandom secureRandom = new SecureRandom();
		byte[] ivByteList = new byte[RANDOM_IV_BYTE_SIZE];
		secureRandom.nextBytes(ivByteList);
		return convertHexadecimalString(ivByteList);
	}

	public String getSecretKey(String password) {
		Map<String, String> envMap = systemUtil.getEnvMap();

		try {
			if (Objects.isNull(envMap.get(BACKEND_SECRET_KEY)) || Objects.isNull(envMap.get(FIXED_SALT))) {
				throw new EncryptDecryptProcessException("No backend secret key or fixed salt in the environment");
			}
			String passwordWithSecretKeySalt = envMap.get(BACKEND_SECRET_KEY) + password + envMap.get(FIXED_SALT);
			MessageDigest sha256 = MessageDigest.getInstance(SHA_256);
			byte[] secretKeyByteList = sha256.digest(passwordWithSecretKeySalt.getBytes(StandardCharsets.UTF_8));
			return convertHexadecimalString(secretKeyByteList);
		}
		catch (Exception e) {
			throw new EncryptDecryptProcessException(
					String.format("Get secret key failed with reason: %s", e.getMessage()));
		}
	}

	public String getEncryptedData(String iv, String secretKey, String configData) {
		try {
			byte[] ivByteList = convertByteList(iv);
			byte[] secretKeyByteList = convertByteList(secretKey);
			byte[] configDataByteList = configData.getBytes(StandardCharsets.UTF_8);
			Cipher cipher = obtainAesAlgorithm(secretKeyByteList, ivByteList, Cipher.ENCRYPT_MODE);
			return Base64.getEncoder().encodeToString(cipher.doFinal(configDataByteList));
		}
		catch (Exception e) {
			throw new EncryptDecryptProcessException("Encrypted data failed");
		}
	}

	public String getDecryptedData(String iv, String secretKey, String encryptedConfigData) {
		try {
			byte[] ivByteList = convertByteList(iv);
			byte[] secretKeyByteList = convertByteList(secretKey);
			Cipher cipher = obtainAesAlgorithm(secretKeyByteList, ivByteList, Cipher.DECRYPT_MODE);
			byte[] encryptedDataBytes = Base64.getDecoder().decode(encryptedConfigData);
			byte[] decryptedDataBytes = cipher.doFinal(encryptedDataBytes);
			return new String(decryptedDataBytes, StandardCharsets.UTF_8);
		}
		catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException
				| InvalidAlgorithmParameterException e) {
			throw new EncryptDecryptProcessException("Decrypted data failed");
		}
		catch (Exception e) {
			throw new DecryptDataOrPasswordException("Incorrect password", HttpStatus.UNAUTHORIZED.value());
		}
	}

	public String getMacBytes(String secretKey, String encryptedData) {
		try {
			Mac sha256Hmac = obtainChecksumAlgorithm(secretKey);
			byte[] hmacData = sha256Hmac.doFinal(encryptedData.getBytes());
			return Base64.getEncoder().encodeToString(hmacData);
		}
		catch (Exception e) {
			throw new EncryptDecryptProcessException("Obtain checksum algorithm in encrypt failed");
		}
	}

	public boolean verifyMacBytes(String secretKey, String encryptedConfigData, String macBytes) {
		Mac sha256Hmac;
		try {
			sha256Hmac = obtainChecksumAlgorithm(secretKey);
			byte[] computedMacBytes = sha256Hmac.doFinal(encryptedConfigData.getBytes());
			byte[] receivedMacBytes = Base64.getDecoder().decode(macBytes);
			return MessageDigest.isEqual(computedMacBytes, receivedMacBytes);
		}
		catch (NoSuchAlgorithmException | InvalidKeyException | NullPointerException | IllegalStateException e) {
			throw new EncryptDecryptProcessException("Obtain checksum algorithm in decrypt failed");
		}
		catch (Exception e) {
			throw new DecryptDataOrPasswordException("Invalid file", HttpStatus.BAD_REQUEST.value());
		}
	}

	private String convertHexadecimalString(byte[] bytes) {
		return IntStream.range(0, bytes.length)
			.mapToObj(i -> String.format("%02x", 0xff & bytes[i]))
			.collect(Collectors.joining());
	}

	private byte[] convertByteList(String hexString) {
		int len = hexString.length();
		byte[] byteArray = new byte[len / 2];

		for (int i = 0; i < len; i += 2) {
			String byteString = hexString.substring(i, i + 2);
			byteArray[i / 2] = (byte) Integer.parseInt(byteString, 16);
		}

		return byteArray;
	}

	private Cipher obtainAesAlgorithm(byte[] secretKeyByteList, byte[] ivByteList, int decryptMode)
			throws NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException,
			InvalidAlgorithmParameterException {
		Cipher cipher = Cipher.getInstance(AES_CBC_PADDING);
		SecretKeySpec secretKeySpec = new SecretKeySpec(secretKeyByteList, "AES");
		IvParameterSpec ivParameterSpec = new IvParameterSpec(ivByteList);
		cipher.init(decryptMode, secretKeySpec, ivParameterSpec);
		return cipher;
	}

	private Mac obtainChecksumAlgorithm(String secretKey) throws NoSuchAlgorithmException, InvalidKeyException {
		Mac sha256Hmac = Mac.getInstance(HMAC_SHA_256);
		SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), HMAC_SHA_256);
		sha256Hmac.init(secretKeySpec);
		return sha256Hmac;
	}

}
