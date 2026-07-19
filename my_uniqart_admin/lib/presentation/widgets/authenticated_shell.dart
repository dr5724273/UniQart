import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/notification_service.dart';
import '../providers/notification_provider.dart';
import '../providers/dashboard_provider.dart';
import '../screens/vehicles/vehicle_approval_screen.dart';
import '../screens/finance/finance_offer_approval_screen.dart';
import '../screens/loans/loan_request_approval_screen.dart';
import '../providers/vehicle_provider.dart';
import '../providers/finance_offer_provider.dart';
import '../providers/loan_request_provider.dart';
import '../providers/booking_provider.dart';

class AuthenticatedShell extends StatefulWidget {
  final Widget child;

  const AuthenticatedShell({super.key, required this.child});

  @override
  State<AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<AuthenticatedShell> {
  StreamSubscription<Map<String, String>>? _clickSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Provider.of<NotificationProvider>(context, listen: false).initSocketConnection();

      _clickSubscription?.cancel();
      _clickSubscription = NotificationService().onNotificationClick.stream.listen((payload) {
        if (mounted) {
          _navigateToScreen(payload['type'] ?? '', payload['url'] ?? '');
        }
      });

      final pending = NotificationService().pendingNavigationPayload;
      if (pending != null) {
        NotificationService().pendingNavigationPayload = null;
        _navigateToScreen(pending['type'] ?? '', pending['url'] ?? '');
      }
    });
  }

  @override
  void dispose() {
    _clickSubscription?.cancel();
    super.dispose();
  }

  void _navigateToScreen(String type, String url) {
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

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, notifProvider, child) {
        final latestNotif = notifProvider.latestInAppNotification;
        if (latestNotif != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            notifProvider.clearLatestInAppNotification();

            // Auto-refresh Dashboard Counts
            Provider.of<DashboardProvider>(context, listen: false).fetchCounts();

            // Auto-refresh the specific list based on notification type
            if (latestNotif.type == 'vehicle_listing') {
              Provider.of<VehicleProvider>(context, listen: false).fetchPendingVehicles();
            } else if (latestNotif.type == 'finance_offer') {
              Provider.of<FinanceOfferProvider>(context, listen: false).fetchPendingOffers();
            } else if (latestNotif.type == 'loan_request') {
              Provider.of<LoanRequestProvider>(context, listen: false).fetchPendingLoans();
            } else if (latestNotif.type == 'booking' || latestNotif.url.contains('booking')) {
              Provider.of<BookingProvider>(context, listen: false).fetchPendingBookings();
            }

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'New approval request received.',
                            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            latestNotif.message,
                            style: const TextStyle(fontSize: 12, color: Colors.white70),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                behavior: SnackBarBehavior.floating,
                duration: const Duration(seconds: 5),
                action: SnackBarAction(
                  label: 'VIEW',
                  textColor: Colors.amberAccent,
                  onPressed: () {
                    _navigateToScreen(latestNotif.type, latestNotif.url);
                  },
                ),
              ),
            );
          });
        }

        return child!;
      },
      child: widget.child,
    );
  }
}
