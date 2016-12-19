var moment = require('moment-timezone');



var oneDayTime = 86400000;
var oneHourTime = 3600000;
var oneHalfHourTime = 1800000;
var oneMinuteTime = 60000;
var estOffSetInTime = 14400000;

var estOffSet = 4.0;

exports.getNext7DaysAndYesterday = getNext7DaysAndYesterday;
exports.getNext7WholeDays 		= getNext7WholeDays;
exports.getNowPlusDays 			= getNowPlusDays;
exports.getNext7Days 			= getNext7Days;
exports.getStartAndEndDateinDay = getStartAndEndDateinDay;
exports.getNextMidnight 		= getNextMidnight;
exports.getLastMidnight 		= getLastMidnight;
exports.findTimeOfDay 			= findTimeOfDay;
exports.findDatesBetweenDates 	= findDatesBetweenDates;
exports.findDayOfWeekDayIs 		= findDayOfWeekDayIs;
exports.getOneHourTime			= getOneHourTime;
exports.convertToServerTimeZone = convertToServerTimeZone;
exports.roundHH 				= roundHH;

exports.getoneHalfHourTime 		= getoneHalfHourTime;
exports.getOneDayTime 			= getOneDayTime;
exports.getManyDaysTime 		= getManyDaysTime;
exports.getDaysAgo 				= getDaysAgo;
exports.getDaysAhead 			= getDaysAhead;
exports.getUpcomingDays 		= getUpcomingDays;

function getDaysAgo(numDays)
{
	return new Date(  (new Date()).getTime() -  (oneDayTime * numDays) );
}

function getDaysAhead(numDays)
{
	return new Date(  (new Date()).getTime() +  (oneDayTime * numDays) );
}

function getoneHalfHourTime()
{
	return oneHalfHourTime;
}

function getOneHourTime()
{
	return oneHourTime;
}

function getOneDayTime()
{
	return oneDayTime;
}

function getManyDaysTime(daysNum)
{
	return daysNum * oneDayTime;
}


function getNext7Days()
{
	var daysA = getDatePlusDays(getLastMidnight(new Date()),7);
	var tmpA = [];
	for (var i = 0; i < daysA.length; i++)
	{
		var obj = new Object();
		obj.date = daysA[i];
		if(i == daysA.length - 1)
		{
			obj.nextdate = new Date(daysA[i].getTime() + 86400000);
		}else{
			obj.nextdate = new Date(daysA[i + 1].getTime());
		}
		obj.date_day = moment(obj.date).tz('America/New_York').format("dddd");
		obj.date_full = moment(obj.date).tz('America/New_York').format("MMM D YYYY");
		tmpA.push(obj);
	};

	return tmpA;
}


function getNext7DaysAndYesterday()
{
	var daysA = [];
	daysA.push(  new Date(  getLastMidnight(new Date()) - getOneDayTime()  )  )
	daysA = daysA.concat(getDatePlusDays(getLastMidnight(new Date()),7));
	var tmpA = [];
	for (var i = 0; i < daysA.length; i++)
	{
		var obj = new Object();
		obj.date = daysA[i];
		if(i == daysA.length - 1)
		{
			obj.nextdate = new Date(daysA[i].getTime() + 86400000);
		}else{
			obj.nextdate = new Date(daysA[i + 1].getTime());
		}
		obj.date_day = moment(obj.date).tz('America/New_York').format("dddd");
		obj.date_full = moment(obj.date).tz('America/New_York').format("MMM D YYYY");
		tmpA.push(obj);
	};

	return tmpA;
}


function getNext7WholeDays()
{
	var daysA = getDatePlusDays(getLastMidnight(new Date()),7);
	var tmpA = [];
	for (var i = 0; i < daysA.length; i++)
	{
		var obj = new Object();
		obj.date = daysA[i];
		if(i == daysA.length - 1)
		{
			obj.nextdate = new Date(daysA[i].getTime() + 86400000);
		}else{
			obj.nextdate = new Date(daysA[i + 1].getTime());
		}
		obj.date_day = moment(obj.date).tz('America/New_York').format("dddd");
		obj.date_full = moment(obj.date).tz('America/New_York').format("MMM D YYYY");
		tmpA.push(obj);
	};

	return tmpA;
}

function convertToServerTimeZone(date)
{
    //var offset = 4.0
    date = String(date);
    var clientDate = new Date(date);
    if(!Object.prototype.toString.call(clientDate) === "[object Date]")
    {
    	return new Date();
    }
    var utc = clientDate.getTime() - (clientDate.getTimezoneOffset() * 60000);
    var serverDate = new Date(utc + (3600000 * estOffSet));
    return roundHH(serverDate);
}

function roundHH(date)
{
	return new Date( Math.round(date.getTime()/1800000)  * 1800000  );
}

function getNowPlusDays(numDays)
{
	var date = new Date();
	return getDatePlusDays(date,numDays);
}

function getUpcomingDays()
{
	var start_date = new Date( (new Date()).getTime() - getOneHourTime() - getOneHourTime() );
	var end_date = new Date( (new Date()).getTime() + (getOneDayTime() * 8) );
	return [start_date,end_date];
}

function getDatePlusDays(date,numDays)
{
	var daysA = [date];
	for (var i = 0; i < numDays; i++)
	{
		var day = new Date(date.getTime());
		if(i == 0)
		{
			day = getNextMidnight(day);
			daysA.push(day);
		}else{
			day = new Date(daysA[daysA.length - 1].getTime() + 86400000);
			daysA.push(day);
		}
	};
	return daysA;
}

function getStartAndEndDateinDay(date)
{
	var start_date = getNextMidnight(date);
	var end_date = getLastMidnight(date);
	return [start_date,end_date]
}

function getNextMidnight(date)
{
	var numDays = Math.floor(date.getTime()/86400000);
	if(date.getTime()%86400000 < 14400000)
	{
		numDays--;
	}
	numDays++;
	return new Date((numDays * 86400000) + 14400000)
}

function getLastMidnight(date)
{
	return (new Date(getNextMidnight(date).getTime() - 86400000));
}

function findTimeOfDay(date)
{
	var sunDate = convertToServerTimeZone("Jun 1 2014 00:00:00");
	return ((date.getTime() - sunDate.getTime())%86400000);
}

function findDayOfWeekDayIs(date)
{
	var daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
	var sunDate = convertToServerTimeZone("Jun 1 2014 00:00:00");
	var numOfDays = ((date.getTime() - sunDate.getTime())/86400000);
	numOfDays = numOfDays%7;
	var dayOfWeek = Math.floor(numOfDays);
	return daysOfWeek[dayOfWeek];
}

function findDatesBetweenDates(start_date,end_date)
{
	var datesA = [];
	datesA.push(start_date);
	var nextMidnight = getNextMidnight(start_date);
	if(nextMidnight.getTime() >= end_date.getTime())
	{
		//datesA.push(nextMidnight)
		return datesA;
	}
	var canDo = true;
	var i = 0;
	while(canDo)
	{
		var tmpDate = new Date(nextMidnight.getTime() + (i * oneDayTime))
		var timeDiff = Math.abs(tmpDate.getTime() - end_date.getTime())
		if(timeDiff < oneDayTime)
		{
			canDo = false;
		}
		datesA.push(tmpDate);
		i++;
	}
	return datesA;
}
