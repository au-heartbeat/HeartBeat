package heartbeat.service.report;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import heartbeat.client.CalendarificFeignClient;
import heartbeat.client.dto.board.jira.CalendarificHolidayResponseDTO;
import heartbeat.controller.report.dto.request.CalendarTypeEnum;
import heartbeat.exception.DecodeCalendarException;
import heartbeat.util.JsonFileReader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VietnamHolidayTest {

	@Mock
	private CalendarificFeignClient calendarificFeignClient;

	@Mock
	private ObjectMapper objectMapper;

	@InjectMocks
	private VietnamHoliday vietnamHoliday;

	@Test
	void loadHolidayListSuccess() throws Exception {
		CalendarTypeEnum country = CalendarTypeEnum.VN;
		String year = "2024";
		CalendarificHolidayResponseDTO calendarificHolidayResponseDTO = JsonFileReader.readJsonFile(
				"./src/test/resources/VietnamCalendarHolidayResponse.json", CalendarificHolidayResponseDTO.class);
		String calendarificHolidayResponseDTOString = calendarificHolidayResponseDTO.toString();
		when(calendarificFeignClient.getHolidays(country.getValue().toLowerCase(), year))
			.thenReturn(calendarificHolidayResponseDTOString);
		when(objectMapper.readValue(eq(calendarificHolidayResponseDTOString), any(Class.class)))
			.thenReturn(calendarificHolidayResponseDTO);

		Map<String, Boolean> result = vietnamHoliday.loadHolidayList(year);

		assertEquals(6, result.size());
		for (String key : result.keySet()) {
			if (Objects.equals(key, "2024-01-01")) {
				assertTrue(result.get(key));
			}
			else {
				assertFalse(result.get(key));
			}
		}
		verify(calendarificFeignClient).getHolidays(country.getValue().toLowerCase(), year);
		verify(objectMapper).readValue(eq(calendarificHolidayResponseDTOString), any(Class.class));
	}

	@Test
	void loadHolidayListErrorWhenDecodeError() throws Exception {
		CalendarTypeEnum country = CalendarTypeEnum.VN;
		String year = "2024";
		CalendarificHolidayResponseDTO calendarificHolidayResponseDTO = JsonFileReader.readJsonFile(
				"./src/test/resources/VietnamCalendarHolidayResponse.json", CalendarificHolidayResponseDTO.class);
		String calendarificHolidayResponseDTOString = calendarificHolidayResponseDTO.toString();
		when(calendarificFeignClient.getHolidays(country.getValue().toLowerCase(), year))
			.thenReturn(calendarificHolidayResponseDTOString);
		when(objectMapper.readValue(eq(calendarificHolidayResponseDTOString), any(Class.class)))
			.thenThrow(JsonMappingException.class);

		assertThrows(DecodeCalendarException.class, () -> {
			vietnamHoliday.loadHolidayList(year);
		});

		verify(calendarificFeignClient).getHolidays(country.getValue().toLowerCase(), year);
		verify(objectMapper).readValue(eq(calendarificHolidayResponseDTOString), any(Class.class));

	}

}