# Auto-Assign System Documentation

## Overview

The auto-assign system automatically distributes users to admins based on workload balancing and configurable limits. It ensures fair distribution of work among admins while respecting user permanence rules.

## Key Features

### 1. **Dynamic Configuration**

- Configurable maximum users per admin (default: 10)
- Enable/disable round-robin vs load balancing
- Enable/disable queue processing
- All settings can be updated dynamically via API

### 2. **Smart Load Balancing**

- **Load Balancing Mode**: Assigns users to admins with the lowest workload percentage
- **Round Robin Mode**: Assigns users to admins with the fewest active users
- Automatic workload rebalancing to maintain equal distribution

### 3. **User Permanence**

- Users with applications are permanently assigned to their admin
- Permanently assigned users are never moved during rebalancing
- Ensures continuity of service for users with ongoing applications

### 4. **Queue Management**

- Users without available admins are queued
- Queue is processed when admins become available
- Queue processing respects user permanence rules

### 5. **Automatic Triggers**

Auto-assign is triggered automatically when:

- User submits personal details
- Admin marks a user as completed (disabled)
- New admin is verified and activated

## Configuration

### Default Settings

```typescript
{
  maxUsersPerAdmin: 10,
  enableRoundRobin: true,
  enableLoadBalancing: true,
  queueProcessingEnabled: true
}
```

### Configuration Options

| Option                   | Type    | Default | Description                       |
| ------------------------ | ------- | ------- | --------------------------------- |
| `maxUsersPerAdmin`       | number  | 10      | Maximum active users per admin    |
| `enableRoundRobin`       | boolean | true    | Use round-robin assignment        |
| `enableLoadBalancing`    | boolean | true    | Use workload-based assignment     |
| `queueProcessingEnabled` | boolean | true    | Enable automatic queue processing |

## API Endpoints

### Super Admin Endpoints

#### 1. Manual Auto-Assign

```http
POST /super-admin/auto-assign-users
Authorization: Bearer <super-admin-token>
```

Triggers manual auto-assignment of users.

#### 2. Get Assignment Statistics

```http
GET /super-admin/dashboard-summary
Authorization: Bearer <super-admin-token>
```

Returns comprehensive assignment statistics including:

- Total users, active users, assigned users
- Queue statistics
- Admin workload breakdown
- Current configuration

#### 3. Get Auto-Assign Configuration

```http
GET /super-admin/auto-assign-config
Authorization: Bearer <super-admin-token>
```

Returns current auto-assign configuration.

#### 4. Update Auto-Assign Configuration

```http
PUT /super-admin/auto-assign-config
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "maxUsersPerAdmin": 15,
  "enableRoundRobin": false,
  "enableLoadBalancing": true,
  "queueProcessingEnabled": true
}
```

#### 5. Rebalance Admin Workloads

```http
POST /super-admin/rebalance-workloads
Authorization: Bearer <super-admin-token>
```

Manually triggers workload rebalancing across all admins.

#### 6. Get Assignment Queue

```http
GET /super-admin/assignment-queue
Authorization: Bearer <super-admin-token>
```

Returns users currently in the assignment queue.

## Assignment Logic

### 1. **User Eligibility**

- Only users with `status: 'ACTIVE'` are considered
- Only users with personal details are assigned
- Users without personal details are skipped

### 2. **Admin Selection**

- Admins must have available slots (active users < maxUsersPerAdmin)
- Load balancing: Selects admin with lowest workload percentage
- Round robin: Selects admin with fewest active users

### 3. **User Permanence**

- Users with applications are permanently assigned
- Permanently assigned users are never moved during rebalancing
- This ensures continuity of service

### 4. **Queue Management**

- Users without available admins are added to queue
- Queue is processed when admins become available
- Queue processing respects user permanence rules

## Automatic Triggers

### 1. **Personal Details Submission**

When a user submits personal details:

```typescript
// In personalDetails.controller.ts
await autoAssignUsers("personal_details_submitted");
```

### 2. **User Completion**

When an admin marks a user as completed:

```typescript
// In admin.controller.ts
await handleUserStatusChange(user.id, "DISABLED");
```

### 3. **Admin Verification**

When a new admin is verified:

```typescript
// In admin.controller.ts
await autoAssignUsersService("admin_verification");
```

## Load Balancing Algorithms

### 1. **Workload-Based (Recommended)**

- Calculates workload percentage for each admin
- Assigns to admin with lowest workload percentage
- Ensures most balanced distribution

### 2. **Round Robin**

- Assigns to admin with fewest active users
- Simple but may not account for admin capacity differences
- Good for equal-capacity scenarios

## Queue Processing

### Queue Entry Conditions

- No available admins with open slots
- User is active and has personal details
- User is not permanently assigned

### Queue Processing

- Processes users in FIFO order (oldest first)
- Removes users from queue when assigned
- Skips permanently assigned users

## Error Handling

### Graceful Degradation

- Auto-assign failures don't break main operations
- Errors are logged but don't fail user requests
- Queue processing continues even if individual assignments fail

### Error Recovery

- Invalid queue entries are automatically removed
- Users with changed status are handled appropriately
- System recovers from temporary failures

## Monitoring and Statistics

### Dashboard Metrics

- Total users and active users
- Assigned vs unassigned users
- Queue length and processing status
- Admin workload breakdown
- Application counts

### Admin Workload Statistics

```typescript
{
  id: string,
  name: string,
  email: string,
  activeUserCount: number,
  availableSlots: number,
  workloadPercentage: number
}
```

## Best Practices

### 1. **Configuration Management**

- Start with default settings
- Monitor workload distribution
- Adjust maxUsersPerAdmin based on admin capacity
- Enable load balancing for optimal distribution

### 2. **Monitoring**

- Regularly check dashboard statistics
- Monitor queue length and processing
- Watch for workload imbalances
- Use rebalancing when needed

### 3. **User Experience**

- Ensure users are assigned quickly after personal details
- Maintain user-admin relationships for users with applications
- Provide clear feedback on assignment status

### 4. **Admin Experience**

- Keep workloads balanced across admins
- Provide clear assignment statistics
- Enable workload rebalancing when needed

## Troubleshooting

### Common Issues

1. **Users not being assigned**

   - Check if admins are verified
   - Verify user has personal details
   - Check queue for stuck users

2. **Uneven workload distribution**

   - Run workload rebalancing
   - Check admin capacity settings
   - Review assignment algorithm settings

3. **Queue not processing**
   - Verify queue processing is enabled
   - Check for available admin slots
   - Review queue processing logic

### Debug Information

- All auto-assign operations are logged
- Check console for assignment triggers
- Monitor queue processing status
- Review admin workload statistics

## Future Enhancements

### Potential Improvements

1. **Advanced Load Balancing**

   - Consider admin performance metrics
   - Factor in application success rates
   - Dynamic capacity adjustment

2. **Smart Queue Management**

   - Priority-based queue processing
   - User preference consideration
   - Time-based queue expiration

3. **Performance Optimization**

   - Batch assignment operations
   - Caching of admin statistics
   - Asynchronous queue processing

4. **Enhanced Monitoring**
   - Real-time assignment tracking
   - Performance metrics dashboard
   - Automated alerting system
