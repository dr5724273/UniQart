import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/booking_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/decision_dialog.dart';

class BookingApprovalScreen extends StatefulWidget {
  const BookingApprovalScreen({super.key});

  @override
  State<BookingApprovalScreen> createState() => _BookingApprovalScreenState();
}

class _BookingApprovalScreenState extends State<BookingApprovalScreen> {
  final Set<String> _processingIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BookingProvider>(context, listen: false).fetchPendingBookings();
    });
  }

  Future<void> _handleDecision(String bookingId, String action, {String? adminNote, String? publicNote}) async {
    setState(() {
      _processingIds.add(bookingId);
    });

    final provider = Provider.of<BookingProvider>(context, listen: false);
    final dashboard = Provider.of<DashboardProvider>(context, listen: false);

    final success = await provider.submitDecision(bookingId, action, adminNote: adminNote, publicNote: publicNote);

    if (mounted) {
      setState(() {
        _processingIds.remove(bookingId);
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Booking successfully ${action == 'approve' ? 'approved' : 'rejected'}.'),
            backgroundColor: action == 'approve' ? Colors.green.shade700 : Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
        dashboard.fetchCounts();
      } else if (provider.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.errorMessage!),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BookingProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Bookings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => provider.fetchPendingBookings(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await provider.fetchPendingBookings();
        },
        child: _buildBody(provider, theme, colorScheme),
      ),
    );
  }

  Widget _buildBody(BookingProvider provider, ThemeData theme, ColorScheme colorScheme) {
    if (provider.isLoading && provider.pendingBookings.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.errorMessage != null && provider.pendingBookings.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 64, color: colorScheme.error),
              const SizedBox(height: 16),
              Text(
                'Failed to load pending bookings',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                provider.errorMessage!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => provider.fetchPendingBookings(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (provider.pendingBookings.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.event_available_rounded, size: 80, color: colorScheme.primary.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  'No Pending Bookings',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'All booking requests have been reviewed.',
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
      itemCount: provider.pendingBookings.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final booking = provider.pendingBookings[index];
        final isProcessing = _processingIds.contains(booking.id);
        final dateFormat = DateFormat('MMM dd, yyyy');

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${booking.vehicleYear} ${booking.vehicleBrand} ${booking.vehicleModel}',
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
                Row(
                  children: [
                    _buildInfoChip(Icons.calendar_today_rounded, '${dateFormat.format(booking.pickupDate)} - ${dateFormat.format(booking.returnDate)}', colorScheme),
                    const SizedBox(width: 8),
                    _buildInfoChip(Icons.access_time_rounded, '${booking.totalDays} Days', colorScheme),
                    const SizedBox(width: 8),
                    _buildInfoChip(Icons.payments_rounded, '₹${booking.totalPrice}', colorScheme),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 16, color: colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        booking.address,
                        style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),

                Text(
                  'Buyer Info',
                  style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${booking.buyerName} (${booking.buyerEmail}) ${booking.buyerPhone.isNotEmpty ? "- ${booking.buyerPhone}" : ""}',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),

                Text(
                  'Lister Info',
                  style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${booking.listerName} (${booking.listerEmail}) ${booking.listerPhone.isNotEmpty ? "- ${booking.listerPhone}" : ""}',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: isProcessing ? null : () {
                          showDecisionBottomSheet(
                            context,
                            title: 'Reject Booking',
                            action: 'reject',
                            onSubmit: (adminNote, publicNote) => _handleDecision(booking.id, 'reject', adminNote: adminNote, publicNote: publicNote),
                          );
                        },
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
                        onPressed: isProcessing ? null : () {
                          showDecisionBottomSheet(
                            context,
                            title: 'Approve Booking',
                            action: 'approve',
                            onSubmit: (adminNote, publicNote) => _handleDecision(booking.id, 'approve', adminNote: adminNote, publicNote: publicNote),
                          );
                        },
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

  Widget _buildInfoChip(IconData icon, String label, ColorScheme colorScheme) {
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
