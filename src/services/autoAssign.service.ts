import prisma from '../config/Db';

// Configuration for auto-assignment
interface AutoAssignConfig {
    maxUsersPerAdmin: number;
    enableRoundRobin: boolean;
    enableLoadBalancing: boolean;
    queueProcessingEnabled: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AutoAssignConfig = {
    maxUsersPerAdmin: 10,
    enableRoundRobin: true,
    enableLoadBalancing: true,
    queueProcessingEnabled: true,
};

// Current configuration (can be updated dynamically)
let currentConfig: AutoAssignConfig = { ...DEFAULT_CONFIG };

/**
 * Update the auto-assign configuration
 */
export const updateAutoAssignConfig = (config: Partial<AutoAssignConfig>) => {
    currentConfig = { ...currentConfig, ...config };
    return currentConfig;
};

/**
 * Get current auto-assign configuration
 */
export const getAutoAssignConfig = () => {
    return { ...currentConfig };
};

/**
 * Get admin workload statistics
 */
const getAdminWorkloadStats = async () => {
    const admins = await prisma.admin.findMany({
        include: {
            assignedUsers: {
                where: { status: 'ACTIVE' }
            }
        }
    });

    return admins.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        activeUserCount: admin.assignedUsers.length,
        availableSlots: currentConfig.maxUsersPerAdmin - admin.assignedUsers.length,
        workloadPercentage: (admin.assignedUsers.length / currentConfig.maxUsersPerAdmin) * 100
    }));
};

/**
 * Find the best admin for assignment using load balancing
 */
const findBestAdminForAssignment = async (excludeAdmins: string[] = []) => {
    const admins = await prisma.admin.findMany({
        include: {
            assignedUsers: {
                where: { status: 'ACTIVE' }
            }
        }
    });

    // Filter out excluded admins and those at capacity
    const availableAdmins = admins.filter(admin =>
        !excludeAdmins.includes(admin.id) &&
        admin.assignedUsers.length < currentConfig.maxUsersPerAdmin
    );

    if (availableAdmins.length === 0) {
        return null;
    }

    if (currentConfig.enableLoadBalancing) {
        // Load balancing: assign to admin with lowest workload
        return availableAdmins.reduce((best, current) => {
            const bestWorkload = best.assignedUsers.length / currentConfig.maxUsersPerAdmin;
            const currentWorkload = current.assignedUsers.length / currentConfig.maxUsersPerAdmin;
            return currentWorkload < bestWorkload ? current : best;
        });
    } else {
        // Round robin: assign to admin with fewest users
        return availableAdmins.reduce((best, current) =>
            current.assignedUsers.length < best.assignedUsers.length ? current : best
        );
    }
};

/**
 * Check if user should be permanently assigned to admin
 */
const isUserPermanentlyAssigned = async (userId: number): Promise<boolean> => {
    const applications = await prisma.application.findMany({
        where: { userId },
        take: 1
    });

    return applications.length > 0;
};

/**
 * Main auto-assign function
 */
export const autoAssignUsers = async (triggerSource?: string) => {
    console.log(`Auto-assign triggered by: ${triggerSource || 'manual'}`);

    try {
        // Get all unassigned active users
        const unassignedUsers = await prisma.user.findMany({
            where: {
                assignedAdminId: null,
                status: 'ACTIVE',
                personalDetails: { isNot: null } // Only users with personal details
            },
            include: {
                personalDetails: true
            }
        });

        if (unassignedUsers.length === 0) {
            console.log('No unassigned users found');
            return { assigned: 0, queued: 0, skipped: 0 };
        }

        let assigned = 0;
        let queued = 0;
        let skipped = 0;

        for (const user of unassignedUsers) {
            // Check if user is permanently assigned to an admin
            const isPermanentlyAssigned = await isUserPermanentlyAssigned(user.id);

            if (isPermanentlyAssigned) {
                console.log(`User ${user.id} is permanently assigned, skipping`);
                skipped++;
                continue;
            }

            // Find best admin for assignment
            const bestAdmin = await findBestAdminForAssignment();

            if (bestAdmin) {
                // Assign user to admin
                await prisma.user.update({
                    where: { id: user.id },
                    data: { assignedAdminId: bestAdmin.id }
                });

                console.log(`Assigned user ${user.id} to admin ${bestAdmin.id}`);
                assigned++;
            } else {
                // No available admins, add to queue
                const existingQueueEntry = await prisma.userAssignmentQueue.findUnique({
                    where: { userId: user.id }
                });

                if (!existingQueueEntry) {
                    await prisma.userAssignmentQueue.create({
                        data: { userId: user.id }
                    });
                    console.log(`Queued user ${user.id}`);
                    queued++;
                }
            }
        }

        // Process queue if enabled
        if (currentConfig.queueProcessingEnabled) {
            await processAssignmentQueue();
        }

        console.log(`Auto-assign complete: ${assigned} assigned, ${queued} queued, ${skipped} skipped`);
        return { assigned, queued, skipped };
    } catch (error) {
        console.error('Auto-assign error:', error);
        throw error;
    }
};

/**
 * Process the assignment queue
 */
export const processAssignmentQueue = async () => {
    try {
        const queue = await prisma.userAssignmentQueue.findMany({
            include: { user: true },
            orderBy: { createdAt: 'asc' }
        });

        if (queue.length === 0) {
            return { processed: 0 };
        }

        let processed = 0;
        const processedUserIds: number[] = [];

        for (const queueEntry of queue) {
            // Check if user is still active and unassigned
            const user = await prisma.user.findUnique({
                where: { id: queueEntry.userId }
            });

            if (!user || user.status !== 'ACTIVE' || user.assignedAdminId !== null) {
                // Remove from queue if user is no longer eligible
                await prisma.userAssignmentQueue.delete({
                    where: { id: queueEntry.id }
                });
                continue;
            }

            // Check if user is permanently assigned
            const isPermanentlyAssigned = await isUserPermanentlyAssigned(user.id);
            if (isPermanentlyAssigned) {
                await prisma.userAssignmentQueue.delete({
                    where: { id: queueEntry.id }
                });
                continue;
            }

            // Find best admin for assignment
            const bestAdmin = await findBestAdminForAssignment();

            if (bestAdmin) {
                // Assign user to admin
                await prisma.user.update({
                    where: { id: user.id },
                    data: { assignedAdminId: bestAdmin.id }
                });

                // Remove from queue
                await prisma.userAssignmentQueue.delete({
                    where: { id: queueEntry.id }
                });

                processedUserIds.push(user.id);
                processed++;
                console.log(`Processed queue: assigned user ${user.id} to admin ${bestAdmin.id}`);
            } else {
                // No available admins, keep in queue
                break;
            }
        }

        console.log(`Queue processing complete: ${processed} users processed`);
        return { processed, processedUserIds };
    } catch (error) {
        console.error('Queue processing error:', error);
        throw error;
    }
};

/**
 * Handle user status change (ACTIVE to DISABLED or vice versa)
 */
export const handleUserStatusChange = async (userId: number, newStatus: 'ACTIVE' | 'DISABLED') => {
    try {
        if (newStatus === 'ACTIVE') {
            // User became active, try to assign them
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { personalDetails: true }
            });

            if (user && user.personalDetails && !user.assignedAdminId) {
                // User has personal details and is unassigned, try to assign
                await autoAssignUsers('user_status_change');
            }
        } else if (newStatus === 'DISABLED') {
            // User became disabled, process queue to fill the slot
            if (currentConfig.queueProcessingEnabled) {
                await processAssignmentQueue();
            }
        }
    } catch (error) {
        console.error('Error handling user status change:', error);
    }
};

/**
 * Get assignment statistics
 */
export const getAssignmentStats = async () => {
    try {
        const [
            totalUsers,
            activeUsers,
            assignedUsers,
            unassignedUsers,
            queuedUsers,
            totalAdmins,
            adminWorkloads
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({ where: { assignedAdminId: { not: null } } }),
            prisma.user.count({ where: { assignedAdminId: null, status: 'ACTIVE' } }),
            prisma.userAssignmentQueue.count(),
            prisma.admin.count(),
            getAdminWorkloadStats()
        ]);

        return {
            totalUsers,
            activeUsers,
            assignedUsers,
            unassignedUsers,
            queuedUsers,
            totalAdmins,
            adminWorkloads,
            config: currentConfig
        };
    } catch (error) {
        console.error('Error getting assignment stats:', error);
        throw error;
    }
};

/**
 * Rebalance admin workloads
 */
export const rebalanceAdminWorkloads = async () => {
    try {
        console.log('Starting admin workload rebalancing...');

        const admins = await prisma.admin.findMany({
            include: {
                assignedUsers: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        // Calculate target workload per admin
        const totalActiveUsers = admins.reduce((sum, admin) => sum + admin.assignedUsers.length, 0);
        const targetUsersPerAdmin = Math.ceil(totalActiveUsers / admins.length);

        let rebalanced = 0;

        for (const admin of admins) {
            if (admin.assignedUsers.length > targetUsersPerAdmin) {
                // This admin has too many users, try to redistribute
                const excessUsers = admin.assignedUsers.length - targetUsersPerAdmin;

                for (let i = 0; i < excessUsers; i++) {
                    const userToMove = admin.assignedUsers[i];

                    // Check if user is permanently assigned
                    const isPermanentlyAssigned = await isUserPermanentlyAssigned(userToMove.id);
                    if (isPermanentlyAssigned) {
                        continue; // Skip permanently assigned users
                    }

                    // Find admin with fewer users
                    const targetAdmin = await findBestAdminForAssignment([admin.id]);

                    if (targetAdmin) {
                        await prisma.user.update({
                            where: { id: userToMove.id },
                            data: { assignedAdminId: targetAdmin.id }
                        });
                        rebalanced++;
                        console.log(`Rebalanced: moved user ${userToMove.id} from admin ${admin.id} to admin ${targetAdmin.id}`);
                    }
                }
            }
        }

        console.log(`Rebalancing complete: ${rebalanced} users moved`);
        return { rebalanced };
    } catch (error) {
        console.error('Rebalancing error:', error);
        throw error;
    }
}; 