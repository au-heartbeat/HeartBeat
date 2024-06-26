package heartbeat.service.report;

import heartbeat.controller.report.dto.request.CalendarTypeEnum;
import heartbeat.service.report.model.WorkInfo;
import heartbeat.config.DayType;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Log4j2
@Component
public class WorkDay {

	private static final long ONE_DAY = 1000L * 60 * 60 * 24;

	private Map<CalendarTypeEnum, Map<String, Boolean>> allCountryHolidayMap = new HashMap<>();

	private final HolidayFactory holidayFactory;

	private List<Integer> loadedYears = new ArrayList<>();

	public WorkDay(HolidayFactory holidayFactory) {
		this.holidayFactory = holidayFactory;
		this.loadAllHolidayList();
	}

	private void loadAllHolidayList() {
		log.info("Start loading all Country holidays for all year");
		for (int year = 2020; year <= Calendar.getInstance().get(Calendar.YEAR); year++) {
			for (CalendarTypeEnum calendarTypeEnum : CalendarTypeEnum.values()) {
				Map<String, Boolean> addedHolidayMap = this.holidayFactory.build(calendarTypeEnum).loadHolidayList(String.valueOf(year));
				if (allCountryHolidayMap.containsKey(calendarTypeEnum)) {
					Map<String, Boolean> loadedYearHolidayMap = new HashMap<>(this.allCountryHolidayMap.get(calendarTypeEnum));
					loadedYearHolidayMap.putAll(addedHolidayMap);
					allCountryHolidayMap.put(calendarTypeEnum, loadedYearHolidayMap);
				} else {
					allCountryHolidayMap.put(calendarTypeEnum, addedHolidayMap);
				}
			}
			loadedYears.add(year);
		}
		log.info("End loading all Country holidays for all year Successfully" + allCountryHolidayMap);
	}

	public void selectCalendarType(CalendarTypeEnum calendarType) {
////		countryHoliday = holidayFactory.build(calendarType);
//		if (loadedYears.isEmpty()) {
//			Integer year = Calendar.getInstance().get(Calendar.YEAR);
////			allCountryHolidayMap.putAll(countryHoliday.loadHolidayList(String.valueOf(year)));
//			loadedYears.add(year);
//		}
	}


	public boolean verifyIfThisDayHoliday(LocalDate localDate, CalendarTypeEnum calendarTypeEnum) {
		String localDateString = localDate.toString();
		if (allCountryHolidayMap.containsKey(calendarTypeEnum) && allCountryHolidayMap.get(calendarTypeEnum).containsKey(localDateString)) {
			return allCountryHolidayMap.get(calendarTypeEnum).get(localDateString);
		}
		return localDate.getDayOfWeek() == DayOfWeek.SATURDAY || localDate.getDayOfWeek() == DayOfWeek.SUNDAY;
	}

	public long calculateWorkDaysBetween(long startTime, long endTime, CalendarTypeEnum calendarTypeEnum, ZoneId timezone) {
		return calculateWorkTimeAndHolidayBetweenWhenHolidayCannotWork(startTime, endTime, calendarTypeEnum, timezone, false)
			.getWorkDays();
	}

	public WorkInfo calculateWorkTimeAndHolidayBetween(long startTime, long endTime, CalendarTypeEnum calendarTypeEnum, ZoneId timezone) {
		return calculateWorkTimeAndHolidayBetweenWhenHolidayCanWork(startTime, endTime, calendarTypeEnum, timezone);
	}

	private List<DayType> getDayType(LocalDate startLocalDate, LocalDate endLocalDate, CalendarTypeEnum calendarTypeEnum) {
		LocalDate localDateIndex = LocalDate.of(startLocalDate.getYear(), startLocalDate.getMonth(),
				startLocalDate.getDayOfMonth());

		List<DayType> holidayTypeList = new ArrayList<>();

		while (!endLocalDate.isBefore(localDateIndex)) {
			if (verifyIfThisDayHoliday(localDateIndex, calendarTypeEnum)) {
				holidayTypeList.add(DayType.NON_WORK_DAY);
			}
			else {
				holidayTypeList.add(DayType.WORK_DAY);
			}
			localDateIndex = localDateIndex.plusDays(1);
		}
		return holidayTypeList;
	}

	private WorkInfo calculateWorkTimeAndHolidayBetweenWhenHolidayCannotWork(long startTime, long endTime, CalendarTypeEnum calendarTypeEnum,
																			 ZoneId timezone, boolean toScale) {
		LocalDate startLocalDate = LocalDate.ofInstant(Instant.ofEpochMilli(startTime), timezone);
		LocalDate endLocalDate = LocalDate.ofInstant(Instant.ofEpochMilli(endTime), timezone);

		List<DayType> dayTypeList = getDayType(startLocalDate, endLocalDate, calendarTypeEnum);

		long totalDays = dayTypeList.size();

		long newStartTime = startTime;
		int startTimeIndex = 0;
		int endTimeIndex = dayTypeList.size() - 1;

		if (dayTypeList.get(startTimeIndex) == DayType.NON_WORK_DAY) {
			while (startTimeIndex < dayTypeList.size() && dayTypeList.get(startTimeIndex) == DayType.NON_WORK_DAY) {
				startTimeIndex++;
			}
			LocalDate newStartLocalDateTime = startLocalDate.plusDays(startTimeIndex);
			newStartTime = newStartLocalDateTime.atStartOfDay(timezone).toInstant().toEpochMilli();
		}

		long newEndTime = endTime;
		if (dayTypeList.get(endTimeIndex) == DayType.NON_WORK_DAY) {
			while (endTimeIndex >= startTimeIndex && dayTypeList.get(endTimeIndex) == DayType.NON_WORK_DAY) {
				endTimeIndex--;
			}
			LocalDate newEndLocalDateTime = startLocalDate.plusDays(endTimeIndex + 1L);
			newEndTime = newEndLocalDateTime.atStartOfDay(timezone).toInstant().toEpochMilli();
		}
		long result = newEndTime - newStartTime;
		if (toScale) {
			dayTypeList = dayTypeList.subList(startTimeIndex, endTimeIndex + 1);
		}
		long holidayNums = dayTypeList.stream().filter(it -> it.equals(DayType.NON_WORK_DAY)).count();
		result = result - holidayNums * ONE_DAY;

		return WorkInfo.builder().holidays(holidayNums).totalDays(totalDays).workTime(result).build();
	}

	private WorkInfo calculateWorkTimeAndHolidayBetweenWhenHolidayCanWork(long startTime, long endTime,
																		  CalendarTypeEnum calendarTypeEnum, ZoneId timezone) {
		long result = endTime - startTime;

		LocalDate startLocalDate = LocalDate.ofInstant(Instant.ofEpochMilli(startTime), timezone);
		LocalDate endLocalDate = LocalDate.ofInstant(Instant.ofEpochMilli(endTime), timezone);

		List<DayType> dayTypeList = getDayType(startLocalDate, endLocalDate, calendarTypeEnum);
		long totalDays = dayTypeList.size();

		for (int i = 0; i < dayTypeList.size() && dayTypeList.get(i) == DayType.NON_WORK_DAY; i++) {
			dayTypeList.set(i, DayType.WORK_DAY);
		}

		for (int i = dayTypeList.size() - 1; i > 0 && dayTypeList.get(i) == DayType.NON_WORK_DAY; i--) {
			dayTypeList.set(i, DayType.WORK_DAY);
		}

		long holidayNums = dayTypeList.stream().filter(it -> it.equals(DayType.NON_WORK_DAY)).count();
		result = result - holidayNums * ONE_DAY;

		return WorkInfo.builder().holidays(holidayNums).totalDays(totalDays).workTime(result).build();
	}

	public double calculateWorkDaysToTwoScale(long startTime, long endTime, CalendarTypeEnum calendarTypeEnum, ZoneId timezone) {
		double days = (double) calculateWorkTimeAndHolidayBetweenWhenHolidayCannotWork(startTime, endTime, calendarTypeEnum,
			timezone, true)
			.getWorkTime() / ONE_DAY;
		return BigDecimal.valueOf(days).setScale(2, RoundingMode.HALF_UP).doubleValue();
	}

}
