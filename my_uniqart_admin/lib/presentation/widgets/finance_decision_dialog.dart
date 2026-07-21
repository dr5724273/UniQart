import 'package:flutter/material.dart';
import '../../domain/entities/finance_offer_entity.dart';

class FinanceDecisionDialog extends StatefulWidget {
  final FinanceOfferEntity offer;
  final String action;
  final Function(String? adminNote, String? publicNote, double? overrideInterestRate, String? overrideTerms) onSubmit;

  const FinanceDecisionDialog({
    super.key,
    required this.offer,
    required this.action,
    required this.onSubmit,
  });

  @override
  State<FinanceDecisionDialog> createState() => _FinanceDecisionDialogState();
}

class _FinanceDecisionDialogState extends State<FinanceDecisionDialog> {
  final _adminNoteController = TextEditingController();
  final _publicNoteController = TextEditingController();
  final _interestRateController = TextEditingController();
  final _termsController = TextEditingController();

  @override
  void dispose() {
    _adminNoteController.dispose();
    _publicNoteController.dispose();
    _interestRateController.dispose();
    _termsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isApprove = widget.action == 'approve';
    
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isApprove ? Icons.check_circle_rounded : Icons.cancel_rounded,
                  color: isApprove ? Colors.green.shade600 : colorScheme.error,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isApprove ? 'Approve Finance Offer' : 'Reject Finance Offer',
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (isApprove) ...[
              TextField(
                controller: _interestRateController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Override Interest Rate (%)',
                  hintText: 'Original: ${widget.offer.interestRate}%',
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _termsController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Override Terms & Conditions',
                  hintText: 'Enter new terms to override...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: _adminNoteController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Internal Admin Note (Optional)',
                hintText: 'Visible only to admins...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _publicNoteController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Public Note (Optional)',
                hintText: 'Visible to the user (buyer/lister)...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 12),
                FilledButton(
                  onPressed: () {
                    Navigator.pop(context);
                    
                    double? parsedInterest;
                    if (_interestRateController.text.trim().isNotEmpty) {
                      parsedInterest = double.tryParse(_interestRateController.text.trim());
                    }
                    
                    String? terms = _termsController.text.trim();
                    if (terms.isEmpty) terms = null;

                    widget.onSubmit(
                      _adminNoteController.text,
                      _publicNoteController.text,
                      parsedInterest,
                      terms,
                    );
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: isApprove ? Colors.green.shade600 : colorScheme.error,
                  ),
                  child: Text(isApprove ? 'Confirm Approve' : 'Confirm Reject'),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

void showFinanceDecisionBottomSheet(
  BuildContext context, {
  required FinanceOfferEntity offer,
  required String action,
  required Function(String? adminNote, String? publicNote, double? overrideInterestRate, String? overrideTerms) onSubmit,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => FinanceDecisionDialog(
      offer: offer,
      action: action,
      onSubmit: onSubmit,
    ),
  );
}
