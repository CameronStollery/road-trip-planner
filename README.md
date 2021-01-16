# road-trip-planner
A tool to optimise pick-ups for a group road trip.
Still in early development.

Use case is when a group of friends is planning to stay somewhere together and will be getting there by driving. Some may not be able to drive there and some will. Some will need to arrive at or leave the destination at different times to others. This tool aims to plan who will be driving and who they will pick up/drop off in a way that minimises the number of cars needed and driving time.

## Technical details
### MiniZinc model
A MiniZinc `enum` type called `Locations` contains identifiers for each location that the program considers, i.e. the destination (with identifier `dest`) and all pickup locations (which have numeric identifiers starting from 1. These are based on identifiers of HTML elements, which may be deleted, hence the numbers may be non-contiguous.) This enum refers to both locations and the people at those locations, so multiple people living at the same location will have separate identifiers. As an example, we could have

```
Locations = {dest, 1, 2, 4, 7};
```

We will use these identifiers in following examples.

The `carSeats` array contains the number of total seats (*including* the driver's seat) in the car of each person, and is indexed by the `Locations` enum. The first element in the array corresponds to the destination, so is always zero, and if someone is not driving, their entry will be zero as well. An example could be

```
carSeats = [0, 0, 3, 3, 5];
```

which represents the following table:

Person|dest|1|2|4|7
---|---|---|---|---|---
**Seats**|N/A|0|3|3|5

The arrays `startTime` and `endTime` are indexed by `Locations`, and the cell corresponding to a person is an integer representing in which time period they will be going to the destination and leaving the destination respectively. For example, if some people were going on Friday night, some on Saturday morning and some on Saturday night, integers 1, 2 and 3 would be assigned to respresent these times. In fact, it would not matter if these were out of order; it is just required that everyone going or leaving in a car together has the same number in their cells of the `startTime` and `endTime` arrays respectively. Note that it is not (currently) possible for someone to be flexible in when they arrive/leave - they must nominate fixed times. As an example of these arrays, if we had people 1 and 7 both arriving Friday night and leaving Sunday morning, and people 2 and 4 arriving Friday morning and leaving Monday afternoon, we would have

`startTime`

Person|dest|1|2|4|7
---|---|---|---|---|---
**Arriving**|N/A|2|1|1|2

`endTime`

Person|dest|1|2|4|7
---|---|---|---|---|---
**Leaving**|N/A|1|2|2|1

The final input parameter is the `durations` 2D array, also indexed by `Locations` for its rows and columns. It stores the driving time (in seconds) from location `i` to location `j` in `durations[i][j]`. For example,

```
durations =
  [| 0.0, 1594.34, 2112.99, 1978.29, 1745.07,
   | 1546.06, 0.0, 656.65, 1562.27, 3186.06,
   | 2084.48, 685.45, 0.0, 1398.39, 3724.48,
   | 1978.27, 1587.86, 1406.49, 0.0, 3494.76,
   | 1642.08, 3090.14, 3608.78, 3383.91, 0.0 |];
```
represents the following table:

.|dest|1|2|4|7
---|---|---|---|---|---
**dest**|0.0|1594.34|2112.99|1978.29|1745.07
**1**|1546.06|0.0|656.65|1562.27|3186.06
**2**|2084.48|685.45|0.0|1398.39|3724.48
**4**|1978.27|1587.86|1406.49|0.0|3494.76
**7**|1642.08|3090.14|3608.78|3383.91|0.0

which would tell us that the time to get from the destination (first row) to location 1 (2nd column) is 1594.34 seconds.

MiniZinc is tasked with assigning values to two 2D arrays, `drivingOrderStart` and `drivingOrderEnd`, both also indexed by `Locations` for their rows and columns. Each row of `drivingOrderStart` (and `drivingOrderEnd`) corresponds to a person (or the destination) and has integers representing the order in which this person drives in. The first row, corresponding to `dest`, will trivially contain zeros to represent that it does not do any driving, as will any row corresponding to a non-driver. If person 2 is driving, picks up person 4 and then goes to the destination, their row in `drivingOrderStart` will have a 1 in the column corresponding to themselves, a 2 in the column corresponding to person 4, and a 3 in the first column, which corresponds to the destination. If they did this in reverse on the way back, their row in `drivingOrderEnd` would have a 1 in the column corresponding to the destination (first column), a 2 in the column corresponding to person 4, and a 3 in the column for themself (person 2). This situation, along with person 7 picking up and dropping off person 1, would yield the following tables:

`drivingOrderStart`

.|dest|1|2|4|7
---|---|---|---|---|---
**dest**|0|0|0|0|0
**1**|0|0|0|0|0
**2**|3|0|1|2|0
**4**|0|0|0|0|0
**7**|3|2|0|0|1

`drivingOrderEnd`

.|dest|1|2|4|7
---|---|---|---|---|---
**dest**|0|0|0|0|0
**1**|0|0|0|0|0
**2**|1|0|3|2|0
**4**|0|0|0|0|0
**7**|1|2|0|0|3

Note that, in general, a driver is not required to drive the same people back that they drove initially.

There are a number of constraints to the assignment of values in these tables:

1. People who aren't driving (and `dest`) can't drive themselves or pick others up, and those who are driving are limited by the number of seats in their car.

  → Row `i` in both `drivingOrderStart` and `drivingOrderEnd` must contain at most `carSeats[i]` nonzero entries.

2. Those who are driving must have an unambiguous order of driving.
  
  → In any given row of `drivingOrderStart` or `drivingOrderEnd`, all nonzero numbers must be unique and contiguous, i.e. all different and at at most *k*, where *k* is the number of nonzero integers in the row.

3. Those who are driving must start at their own home on the way there.

→ If row `i` of `drivingOrderStart` has nonzero entries, it must have a 1 in column `i`.

4. Those who are driving must finish at their own home on the way back.

→ If row `i` of `drivingOrderEnd` has nonzero entries, its maximum entry must be in column `i`.

5. Those who are driving must finish at the destination on the way there.

→ If row `i` of `drivingOrderStart` has nonzero entries, it must have a 1 in the first (`dest`) column.

6. Those who are driving must start at the destination on the way back.

→ If row `i` of `drivingOrderStart` has nonzero entries, it must have a 1 in the first (`dest`) column.

7. Everyone needs to get there and get back, but must only travels in one car at a time.

→ Each column of `drivingOrderStart` and `drivingOrderEnd`, except for the first (`dest`) column, must have exactly one nonzero entry.

8. (more conditions about timing tbd)
