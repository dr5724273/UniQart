import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../vehicles/vehicle_approval_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DashboardProvider>(context, listen: false).fetchCounts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final dashboardProvider = Provider.of<DashboardProvider>(context);
    final user = authProvider.user;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        title: const Text(
          'MyUniQart Admin',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Counts',
            onPressed: () => dashboardProvider.fetchCounts(),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
            onPressed: () => authProvider.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await dashboardProvider.fetchCounts();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Admin Header Card
              Container(
                padding: const EdgeInsets.all(20.0),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [colorScheme.primary, colorScheme.primaryContainer],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.admin_panel_settings_rounded, color: colorScheme.onPrimary, size: 32),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Admin Portal Overview',
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: colorScheme.onPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Welcome back, ${user?.name ?? 'Admin'} (${user?.email ?? ''})',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onPrimary.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text(
                'Pending Approvals Queue',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 12),

              if (dashboardProvider.isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48.0),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (dashboardProvider.errorMessage != null)
                Card(
                  color: colorScheme.errorContainer,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      children: [
                        Icon(Icons.error_outline_rounded, color: colorScheme.onErrorContainer, size: 40),
                        const SizedBox(height: 12),
                        Text(
                          'Failed to refresh dashboard counts',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: colorScheme.onErrorContainer,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          dashboardProvider.errorMessage!,
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onErrorContainer,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () => dashboardProvider.fetchCounts(),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Column(
                  children: [
                    // Pending Vehicles Card (Clickable to Vehicle Approval Screen)
                    _buildCountCard(
                      context,
                      title: 'Pending Vehicles',
                      count: dashboardProvider.counts.pendingVehicles,
                      icon: Icons.directions_car_rounded,
                      color: Colors.blue.shade700,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const VehicleApprovalScreen()),
                        ).then((_) {
                          dashboardProvider.fetchCounts();
                        });
                      },
                    ),
                    const SizedBox(height: 12),

                    // Pending Finance Offers Card
                    _buildCountCard(
                      context,
                      title: 'Pending Finance Offers',
                      count: dashboardProvider.counts.pendingFinanceOffers,
                      icon: Icons.account_balance_rounded,
                      color: Colors.purple.shade700,
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Finance Offer Approval feature coming in next phase.'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    // Pending Loan Requests Card
                    _buildCountCard(
                      context,
                      title: 'Pending Loan Requests',
                      count: dashboardProvider.counts.pendingLoanRequests,
                      icon: Icons.request_quote_rounded,
                      color: Colors.amber.shade800,
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Loan Request Approval feature coming in next phase.'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCountCard(
    BuildContext context, {
    required String title,
    required int count,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      count == 1 ? '1 item requiring action' : '$count items requiring action',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: count > 0 ? color : theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: count > 0 ? Colors.white : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
