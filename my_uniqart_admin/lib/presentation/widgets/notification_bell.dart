import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import '../providers/dashboard_provider.dart';
import '../screens/vehicles/vehicle_approval_screen.dart';
import '../screens/finance/finance_offer_approval_screen.dart';
import '../screens/loans/loan_request_approval_screen.dart';

class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key});

  void _openApprovalScreen(BuildContext context, String type, String url) {
    Navigator.pop(context); // Close bottom sheet
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);

    if (type == 'vehicle_listing' || url.contains('vehicles')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const VehicleApprovalScreen()),
      ).then((_) => dashboardProvider.fetchCounts());
    } else if (type == 'finance_offer' || url.contains('offers')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const FinanceOfferApprovalScreen()),
      ).then((_) => dashboardProvider.fetchCounts());
    } else if (type == 'loan_request' || url.contains('loans')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoanRequestApprovalScreen()),
      ).then((_) => dashboardProvider.fetchCounts());
    }
  }

  void _showNotificationSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return Consumer<NotificationProvider>(
          builder: (context, notifProvider, _) {
            final notifications = notifProvider.notifications;
            final theme = Theme.of(context);
            final colorScheme = theme.colorScheme;

            return DraggableScrollableSheet(
              initialChildSize: 0.6,
              minChildSize: 0.4,
              maxChildSize: 0.9,
              expand: false,
              builder: (context, scrollController) {
                return Column(
                  children: [
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.notifications_active_rounded, color: colorScheme.primary),
                              const SizedBox(width: 8),
                              Text(
                                'Admin Notifications',
                                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          if (notifProvider.unreadCount > 0)
                            TextButton(
                              onPressed: () => notifProvider.markAllAsRead(),
                              child: const Text('Mark all read'),
                            ),
                        ],
                      ),
                    ),
                    const Divider(),
                    Expanded(
                      child: notifications.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.notifications_none_rounded, size: 64, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5)),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No notifications yet',
                                    style: theme.textTheme.titleMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            )
                          : ListView.separated(
                              controller: scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: notifications.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final n = notifications[index];
                                return Card(
                                  elevation: n.isRead ? 0 : 2,
                                  color: n.isRead ? colorScheme.surface : colorScheme.primaryContainer.withValues(alpha: 0.3),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  child: ListTile(
                                    onTap: () {
                                      notifProvider.markAsRead(n.id);
                                      _openApprovalScreen(context, n.type, n.url);
                                    },
                                    leading: CircleAvatar(
                                      backgroundColor: colorScheme.primary,
                                      child: Icon(
                                        n.type == 'vehicle_listing'
                                            ? Icons.directions_car_rounded
                                            : n.type == 'finance_offer'
                                                ? Icons.account_balance_rounded
                                                : Icons.request_quote_rounded,
                                        color: colorScheme.onPrimary,
                                        size: 20,
                                      ),
                                    ),
                                    title: Text(
                                      n.title,
                                      style: TextStyle(
                                        fontWeight: n.isRead ? FontWeight.normal : FontWeight.bold,
                                      ),
                                    ),
                                    subtitle: Text(n.message),
                                    trailing: !n.isRead
                                        ? Container(
                                            width: 10,
                                            height: 10,
                                            decoration: BoxDecoration(
                                              color: colorScheme.primary,
                                              shape: BoxShape.circle,
                                            ),
                                          )
                                        : null,
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, notifProvider, _) {
        final unread = notifProvider.unreadCount;
        return IconButton(
          tooltip: 'Notifications',
          onPressed: () => _showNotificationSheet(context),
          icon: Badge(
            isLabelVisible: unread > 0,
            label: Text('$unread'),
            child: const Icon(Icons.notifications_outlined),
          ),
        );
      },
    );
  }
}
