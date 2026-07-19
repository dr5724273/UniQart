import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/finance_offer_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/decision_dialog.dart';

class FinanceOfferApprovalScreen extends StatefulWidget {
  const FinanceOfferApprovalScreen({super.key});

  @override
  State<FinanceOfferApprovalScreen> createState() => _FinanceOfferApprovalScreenState();
}

class _FinanceOfferApprovalScreenState extends State<FinanceOfferApprovalScreen> {
  final Set<String> _processingIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<FinanceOfferProvider>(context, listen: false).fetchPendingOffers();
    });
  }

  Future<void> _handleDecision(String offerId, String action, {String? adminNote, String? publicNote}) async {
    setState(() {
      _processingIds.add(offerId);
    });

    final offerProvider = Provider.of<FinanceOfferProvider>(context, listen: false);
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);

    final success = await offerProvider.submitDecision(offerId, action, adminNote: adminNote, publicNote: publicNote);

    if (mounted) {
      setState(() {
        _processingIds.remove(offerId);
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Finance offer successfully ${action == 'approve' ? 'approved' : 'rejected'}.'),
            backgroundColor: action == 'approve' ? Colors.green.shade700 : Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
        dashboardProvider.fetchCounts();
      } else if (offerProvider.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(offerProvider.errorMessage!),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final offerProvider = Provider.of<FinanceOfferProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Finance Offers Approval'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => offerProvider.fetchPendingOffers(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await offerProvider.fetchPendingOffers();
        },
        child: _buildBody(offerProvider, theme, colorScheme),
      ),
    );
  }

  Widget _buildBody(
    FinanceOfferProvider offerProvider,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    if (offerProvider.isLoading && offerProvider.pendingOffers.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (offerProvider.errorMessage != null && offerProvider.pendingOffers.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 64, color: colorScheme.error),
              const SizedBox(height: 16),
              Text(
                'Failed to load pending finance offers',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                offerProvider.errorMessage!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => offerProvider.fetchPendingOffers(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (offerProvider.pendingOffers.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.account_balance_outlined, size: 80, color: colorScheme.primary.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  'No Pending Finance Offers',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'All finance offers have been reviewed or approved.',
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
      itemCount: offerProvider.pendingOffers.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final offer = offerProvider.pendingOffers[index];
        final isProcessing = _processingIds.contains(offer.id);
        final durationsStr = offer.durationMonths.map((d) => '${d}m').join(', ');

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
                        '₹${offer.minLoan.toStringAsFixed(0)} - ₹${offer.maxLoan.toStringAsFixed(0)}',
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
                    _buildInfoChip(Icons.percent_rounded, '${offer.interestRate}% p.a.', colorScheme),
                    const SizedBox(width: 12),
                    _buildInfoChip(Icons.schedule_rounded, durationsStr.isEmpty ? '12m' : durationsStr, colorScheme),
                    const SizedBox(width: 12),
                    _buildInfoChip(Icons.security_rounded, offer.collateralRequired.toUpperCase(), colorScheme),
                  ],
                ),
                const Divider(height: 24),

                Text(
                  'Lender Information',
                  style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${offer.lenderName} (${offer.lenderEmail})',
                  style: theme.textTheme.bodyMedium,
                ),
                if (offer.terms.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Terms & Conditions',
                    style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    offer.terms,
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: isProcessing ? null : () {
                          showDecisionBottomSheet(
                            context,
                            title: 'Reject Finance Offer',
                            action: 'reject',
                            onSubmit: (adminNote, publicNote) => _handleDecision(offer.id, 'reject', adminNote: adminNote, publicNote: publicNote),
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
                            title: 'Approve Finance Offer',
                            action: 'approve',
                            onSubmit: (adminNote, publicNote) => _handleDecision(offer.id, 'approve', adminNote: adminNote, publicNote: publicNote),
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
