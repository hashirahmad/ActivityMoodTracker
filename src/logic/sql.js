// why: becauause of https://www.gun.io/blog/multi-line-strings-in-json
export default {
    activityTagsWithActivity: [
        "select * from Activity",
        "inner join ActivityTag on Activity.activityId = ActivityTag.activityId",
        "inner join Tag on ActivityTag.activityTagId = Tag.tagId",
        "where Activity.archive is null or Activity.archive = 0"
    ],
    activities: [
        "select a.*",
        "from Activity a",
        "left join Log l on a.activityId = l.activityId",
        "where (a.archive is null or a.archive = 0)",
        "group by a.activityName",
        "order by l.logEndTime desc"
    ],
    tags: "select * from Tag where archive is null or archive = 0",
    activityTags: [
        "select Tag.tagId, Tag.tagName from ActivityTag",
        "inner join Tag on ActivityTag.tagId = Tag.tagId",
        "where ActivityTag.activityId = ? and (archive is null or archive = 0)"
    ],
    updateActivity: [
        "update Activity set activityName = ?,",
        "goalLength = ?,",
        "goalType = ?,",
        "habitType = ?,",
        "habitIncDecByMins = ?,",
        "habitAverageLength = ?,",
        "habitAverageLookBackMonths = ?",
        "where activityId = ?"
    ],
    moods: "select * from Mood where archive is null or archive = 0",
    activityLogs: [
        "select * from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "order by L.logStartTime desc"
    ],
    activityLogsForADay: [
        "select * from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime like ?",
        "order by L.logStartTime asc"
    ],
    activityLogsSearch: [
        "select * from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logNote like ? or A.activityName like ? or M.moodName like ?",
        "order by L.logStartTime asc"
    ],
    deleteActivity: "update Activity set archive = 1 where activityId = ?",
    pastActivityWarning: [
        "select count(L.logId) as logCount, M.moodName",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where A.activityId = ? and",
        "(A.archive = 0  or A.archive is null) and",
        "(M.moodName = 'Sad' or M.moodName = 'Angry') and",
        "(STRFTIME('%Y', L.logStartTime) = ? AND",
        "STRFTIME('%m', L.logStartTime) = ? AND",
        "STRFTIME('%H', L.logStartTime) = ?)",
        "group by M.moodName",
        "having logCount >= (select value from config where key = 'numberOfLogsBeforeWarning')"
    ],
    config: "select * from config",
    saveConfig: "update config set value = ? where key = ?",
    habitActivityWarning: [
        "select avg((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as avgMins,",
		"count(L.logId) as logCount,",
		"max((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as maxMins",
        "FROM Log L",
        "inner join Activity A on L.activityId = A.activityId",
        "where L.logStartTime between ? and ?",
        "and A.activityId = ?",
        "group by A.activityName"
    ],
    deleteLog: "delete from Log where logId = ?",
    dashboardActivitiesSum: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "A.activityName,",
        "A.activityId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "where L.logStartTime between ? and ?",
        "group by A.activityName",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardTagSum: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
            "t.tagName,",
            "t.tagId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "inner join ActivityTag att on att.activityId = a.activityId",
        "left join Tag t on t.tagId = att.tagId",
        "where L.logStartTime between ? and ?",
        "group by t.tagName",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardActivitiesSumMoods: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "ifnull(M.moodName, 'Without mood') as moodName,",
        "M.moodId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "and A.activityId = ?",
        "group by M.moodId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardMoodSum: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "ifnull(M.moodName, 'Without mood') as moodName,",
        "M.moodId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "group by M.moodId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardActivitiesSumActivities: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "A.activityName,",
        "A.activityId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "and (M.moodId is ?)",
        "group by A.activityId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardActivitiesSumActivitiesForNull: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "A.activityName,",
        "A.activityId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "and (M.moodId is null)",
        "group by A.activityId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    moodSumByEachDay: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
		"ifnull(M.moodName, 'Without mood') as moodName,",
		"M.moodId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
		"left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "group by M.moodId",
        "having logDiff > 0",
		"order by M.moodId"
    ],
    moodSumByEachDayBetter: [
        `select`,
        `sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as duration,`,
        `(`,
            `select group_concat(totalForEach.obj, ' > ')`,
            `from (`,
                `select '{ "moodName": "' || ifnull(M.moodName, 'Without mood') || '", "moodId": ' || ifnull(M.moodId, 'null') || ', "logDiff": ' ||`,
                    `sum((strftime('%s', L2.logEndTime) - (strftime('%s', L2.logStartTime))) / 60) ||`,
                    `', "date": "' || date(L2.logStartTime) || '" }' as obj`,
                `from Log L2`,
                `left join Activity A on A.activityId = L2.activityId`,
                `left join Mood M on M.moodId = L2.moodId`,
                `where L2.logStartTime between ? and ?`,
                `and date(L2.logStartTime) = date(L.logStartTime)`,
                `group by M.moodName`,
            `) totalForEach`,
        `) as obj`,
        `from Log L`,
        `left join Activity A on A.activityId = L.activityId`,
        `left join Mood M on M.moodId = L.moodId`,
        `where L.logStartTime between ? and ?`,
		`group by date(L.logStartTime)`,
        `order by L.logStartTime`,
    ],
    updateHabitWarningLastTime: "update Activity set habitWarningLastTime = ? where activityId = ?",
    dashboardMoodSumTags: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "ifnull(M.moodName, 'Without mood') as moodName,",
        "M.moodId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "inner join Mood M on M.moodId = L.moodId",
        "inner join ActivityTag att on att.activityId = a.activityId",
        "inner join Tag t on t.tagId = att.tagId",
        "where L.logStartTime between ? and ?",
        "group by M.moodId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardCorrespondingMoodForTags: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "ifnull(M.moodName, 'Without mood') as moodName,",
        "M.moodId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "inner join ActivityTag att on att.activityId = a.activityId",
        "inner join Tag t on t.tagId = att.tagId",
        "where L.logStartTime between ? and ?",
        "and t.tagId = ?",
        "group by M.moodId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    dashboardCorrespondingTagsForMood: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "t.tagName,",
        "t.tagId",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "inner join Mood M on M.moodId = L.moodId",
        "inner join ActivityTag att on att.activityId = a.activityId",
        "inner join Tag t on t.tagId = att.tagId",
        "where L.logStartTime between ? and ?",
        "and (M.moodId is ? or M.moodId is null)",
        "group by A.activityId",
        "having logDiff > 0",
        "order by logDiff desc"
    ],
    timelineMoodBased: [
        "select date(L.logStartTime) as day,", 	
        "sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as duration,",
        "(",
            "select ifnull(M.moodName, 'Without mood') as moodName",
            "from Log L2",
            "inner join Activity A on A.activityId = L2.activityId",
            "left join Mood M on M.moodId = L2.moodId",
            "where date(L2.logStartTime) = date(L.logStartTime)",
            "and L2.logStartTime between ? and ?",
            "group by M.moodId",
            "order by sum((strftime('%s', L2.logEndTime) - (strftime('%s', L2.logStartTime))) / 60) desc",
            "LIMIT 1",
        ") as moodName",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "group by day",
        "order by L.logStartTime",
    ],
    activityGraph: [
        `select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,`,
        `date(L.logStartTime) as day,`,
        `(`,
            `select ifnull(M.moodName, 'Without mood') as moodName`,
            `from Log L2`,
            `inner join Activity A on A.activityId = L2.activityId`,
            `left join Mood M on M.moodId = L2.moodId`,
            `where date(L2.logStartTime) = date(L.logStartTime)`,
            `and L2.logStartTime between ? and ?`,
            `group by M.moodId`,
            `order by sum((strftime('%s', L2.logEndTime) - (strftime('%s', L2.logStartTime))) / 60) desc`,
            `LIMIT 1`,
        `) as moodName`,
        `from Log L`,
        `inner join Activity A on A.activityId = L.activityId`,
        `left join Mood M on M.moodId = L.moodId`,
        `where L.logStartTime between ? and ?`,
        `and A.activityId = ?`,
        `group by date(L.logStartTime)`,
        `having logDiff > 0`,
        `order by L.logStartTime`,
    ],
    activityGraphAll: [
        `select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,`,
        `date(L.logStartTime) as day,`,
        `(`,
            `select ifnull(M.moodName, 'Without mood') as moodName`,
            `from Log L2`,
            `inner join Activity A on A.activityId = L2.activityId`,
            `left join Mood M on M.moodId = L2.moodId`,
            `where date(L2.logStartTime) = date(L.logStartTime)`,
            `and L2.logStartTime between ? and ?`,
            `group by M.moodId`,
            `order by sum((strftime('%s', L2.logEndTime) - (strftime('%s', L2.logStartTime))) / 60) desc`,
            `LIMIT 1`,
        `) as moodName`,
        `from Log L`,
        `inner join Activity A on A.activityId = L.activityId`,
        `left join Mood M on M.moodId = L.moodId`,
        `where L.logStartTime between ? and ?`,
        `group by date(L.logStartTime)`,
        `having logDiff > 0`,
        `order by L.logStartTime`,
    ],
    activityGraphForSingleDay: [
        "select sum((strftime('%s', L.logEndTime) - (strftime('%s', L.logStartTime))) / 60) as logDiff,",
        "L.logStartTime as time,",
        "ifnull(M.moodName, 'Without mood') as moodName",
        "from Log L",
        "inner join Activity A on A.activityId = L.activityId",
        "left join Mood M on M.moodId = L.moodId",
        "where L.logStartTime between ? and ?",
        "and A.activityId = ?",
        "group by strftime('%H', L.logEndTime)",
        "having logDiff > 0",
        "order by L.logStartTime"
    ]

}