import 'package:flutter/material.dart';

class DecisionDialog extends StatefulWidget {
  final String title;
  final String action;
  final Function(String? adminNote, String? publicNote) onSubmit;

  const DecisionDialog({
    super.key,
    required this.title,
    required this.action,
    required this.onSubmit,
  });

  @override
  State<DecisionDialog> createState() => _DecisionDialogState();
}

class _DecisionDialogState extends State<DecisionDialog> {
  final _adminNoteController = TextEditingController();
  final _publicNoteController = TextEditingController();

  @override
  void dispose() {
    _adminNoteController.dispose();
    _publicNoteController.dispose();
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
                  widget.title,
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _adminNoteController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Internal Admin Note (Optional)',
              hintText: 'Visible only to admins...',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _publicNoteController,
            maxLines: 3,
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
                  widget.onSubmit(
                    _adminNoteController.text,
                    _publicNoteController.text,
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
    );
  }
}

void showDecisionBottomSheet(
  BuildContext context, {
  required String title,
  required String action,
  required Function(String? adminNote, String? publicNote) onSubmit,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => DecisionDialog(
      title: title,
      action: action,
      onSubmit: onSubmit,
    ),
  );
}
