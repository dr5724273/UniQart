import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import '../providers/dashboard_provider.dart';
import '../screens/vehicles/vehicle_approval_screen.dart';
import '../screens/finance/finance_offer_approval_screen.dart';
import '../screens/loans/loan_request_approval_screen.dart';

class AuthenticatedShell extends StatefulWidget {
  final Widget child;

  const AuthenticatedShell({super.key, required this.child});

  @override
  State<AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<AuthenticatedShell> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).initSocketConnection();
    });
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
