import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../providers/dashboard_provider.dart';

class VehicleApprovalScreen extends StatefulWidget {
  const VehicleApprovalScreen({super.key});

  @override
  State<VehicleApprovalScreen> createState() => _VehicleApprovalScreenState();
}

class _VehicleApprovalScreenState extends State<VehicleApprovalScreen> {
  final Set<String> _processingIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VehicleProvider>(context, listen: false).fetchPendingVehicles();
    });
  }

  Future<void> _handleDecision(String vehicleId, String action) async {
    setState(() {
      _processingIds.add(vehicleId);
    });

    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);

    final success = await vehicleProvider.submitDecision(vehicleId, action);

    if (mounted) {
      setState(() {
        _processingIds.remove(vehicleId);
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Vehicle successfully ${action == 'approve' ? 'approved' : 'rejected'}.'),
            backgroundColor: action == 'approve' ? Colors.green.shade700 : Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
        dashboardProvider.fetchCounts();
      } else if (vehicleProvider.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(vehicleProvider.errorMessage!),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicleProvider = Provider.of<VehicleProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Vehicles Approval'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => vehicleProvider.fetchPendingVehicles(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await vehicleProvider.fetchPendingVehicles();
        },
        child: _buildBody(vehicleProvider, theme, colorScheme),
      ),
    );
  }

  Widget _buildBody(
    VehicleProvider vehicleProvider,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    if (vehicleProvider.isLoading && vehicleProvider.pendingVehicles.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (vehicleProvider.errorMessage != null && vehicleProvider.pendingVehicles.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 64, color: colorScheme.error),
              const SizedBox(height: 16),
              Text(
                'Failed to load pending vehicles',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                vehicleProvider.errorMessage!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => vehicleProvider.fetchPendingVehicles(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (vehicleProvider.pendingVehicles.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.directions_car_outlined, size: 80, color: colorScheme.primary.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  'No Pending Vehicles',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'All vehicle listings have been reviewed or approved.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      itemCount: vehicleProvider.pendingVehicles.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final vehicle = vehicleProvider.pendingVehicles[index];
        final isProcessing = _processingIds.contains(vehicle.id);

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and Status Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${vehicle.year} ${vehicle.brand} ${vehicle.model}',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'PENDING',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Specs Grid
                Row(
                  children: [
                    _buildSpecChip(Icons.category_outlined, vehicle.vehicleType.toUpperCase(), colorScheme),
                    const SizedBox(width: 12),
                    _buildSpecChip(Icons.location_on_outlined, vehicle.city.isEmpty ? 'India' : vehicle.city, colorScheme),
                    const SizedBox(width: 12),
                    _buildSpecChip(Icons.currency_rupee_rounded, '${vehicle.pricePerDay}/day', colorScheme),
                  ],
                ),
                const Divider(height: 24),

                // Owner Info
                Text(
                  'Lister Information',
                  style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${vehicle.ownerName} (${vehicle.ownerEmail})',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 20),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: isProcessing ? null : () => _handleDecision(vehicle.id, 'reject'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: colorScheme.error,
                          side: BorderSide(color: colorScheme.error),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.close_rounded, size: 20),
                        label: const Text('Reject', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: isProcessing ? null : () => _handleDecision(vehicle.id, 'approve'),
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.green.shade600,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: isProcessing
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_rounded, size: 20),
                        label: const Text('Approve', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSpecChip(IconData icon, String label, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: colorScheme.primary),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
