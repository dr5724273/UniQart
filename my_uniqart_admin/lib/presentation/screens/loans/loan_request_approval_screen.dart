import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/loan_request_provider.dart';
import '../../providers/dashboard_provider.dart';

class LoanRequestApprovalScreen extends StatefulWidget {
  const LoanRequestApprovalScreen({super.key});

  @override
  State<LoanRequestApprovalScreen> createState() => _LoanRequestApprovalScreenState();
}

class _LoanRequestApprovalScreenState extends State<LoanRequestApprovalScreen> {
  final Set<String> _processingIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LoanRequestProvider>(context, listen: false).fetchPendingLoans();
    });
  }

  Future<void> _handleDecision(String loanId, String action) async {
    setState(() {
      _processingIds.add(loanId);
    });

    final loanProvider = Provider.of<LoanRequestProvider>(context, listen: false);
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);

    final success = await loanProvider.submitDecision(loanId, action);

    if (mounted) {
      setState(() {
        _processingIds.remove(loanId);
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Loan request successfully ${action == 'approve' ? 'approved' : 'rejected'}.'),
            backgroundColor: action == 'approve' ? Colors.green.shade700 : Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
        dashboardProvider.fetchCounts();
      } else if (loanProvider.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(loanProvider.errorMessage!),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final loanProvider = Provider.of<LoanRequestProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Loan Requests Approval'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => loanProvider.fetchPendingLoans(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await loanProvider.fetchPendingLoans();
        },
        child: _buildBody(loanProvider, theme, colorScheme),
      ),
    );
  }

  Widget _buildBody(
    LoanRequestProvider loanProvider,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    if (loanProvider.isLoading && loanProvider.pendingLoans.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (loanProvider.errorMessage != null && loanProvider.pendingLoans.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 64, color: colorScheme.error),
              const SizedBox(height: 16),
              Text(
                'Failed to load pending loan requests',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                loanProvider.errorMessage!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => loanProvider.fetchPendingLoans(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (loanProvider.pendingLoans.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.request_quote_outlined, size: 80, color: colorScheme.primary.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  'No Pending Loan Requests',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'All loan requests have been reviewed or approved.',
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
      itemCount: loanProvider.pendingLoans.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final loan = loanProvider.pendingLoans[index];
        final isProcessing = _processingIds.contains(loan.id);

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
                        '₹${loan.requestedAmount.toStringAsFixed(0)} Request',
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
                    _buildInfoChip(Icons.schedule_rounded, '${loan.durationMonths} Months', colorScheme),
                    const SizedBox(width: 12),
                    _buildInfoChip(Icons.work_outline_rounded, loan.employmentStatus, colorScheme),
                    const SizedBox(width: 12),
                    _buildInfoChip(Icons.account_balance_wallet_outlined, '₹${loan.monthlyIncome}/mo', colorScheme),
                  ],
                ),
                const Divider(height: 24),

                Text(
                  'Borrower (Buyer) Details',
                  style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${loan.buyerName} (${loan.buyerEmail}) ${loan.buyerPhone.isNotEmpty ? "- ${loan.buyerPhone}" : ""}',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),

                Text(
                  'Lender Details',
                  style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${loan.lenderName} (${loan.lenderEmail})',
                  style: theme.textTheme.bodyMedium,
                ),
                if (loan.collateralDescription.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Collateral Info (${loan.collateralType.toUpperCase()})',
                    style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    loan.collateralDescription,
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: isProcessing ? null : () => _handleDecision(loan.id, 'reject'),
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
                        onPressed: isProcessing ? null : () => _handleDecision(loan.id, 'approve'),
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
