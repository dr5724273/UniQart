import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/user_audit_provider.dart';
import '../../../domain/entities/user_audit_entity.dart';

class UserAuditScreen extends StatelessWidget {
  final String userId;
  final String userName;

  const UserAuditScreen({
    Key? key,
    required this.userId,
    required this.userName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // LOCAL provider per screen instance - no stale singleton state
    return ChangeNotifierProvider(
      create: (_) => UserAuditProvider(),
      child: _UserAuditScreenBody(userId: userId, userName: userName),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({Key? key, required this.status}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'approved':
      case 'active':
        bgColor = Colors.green.shade100;
        textColor = Colors.green.shade800;
        break;
      case 'rejected':
      case 'suspended':
        bgColor = Colors.red.shade100;
        textColor = Colors.red.shade800;
        break;
      case 'pending':
      default:
        bgColor = Colors.orange.shade100;
        textColor = Colors.orange.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _UserAuditScreenBody extends StatefulWidget {
  final String userId;
  final String userName;

  const _UserAuditScreenBody({required this.userId, required this.userName});

  @override
  State<_UserAuditScreenBody> createState() => _UserAuditScreenBodyState();
}

class _UserAuditScreenBodyState extends State<_UserAuditScreenBody> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        debugPrint('[UserAuditScreen] Fetching audit for userId: ${widget.userId}');
        Provider.of<UserAuditProvider>(context, listen: false).fetchUserAudit(widget.userId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Audit: ${widget.userName}'),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        titleTextStyle: const TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      body: Consumer<UserAuditProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.errorMessage != null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      provider.errorMessage!,
                      style: const TextStyle(color: Colors.red, fontSize: 15),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => provider.fetchUserAudit(widget.userId),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final data = provider.auditData;
          if (data == null) {
            return const Center(child: Text('No data found.'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildUserSummary(data.user),
                const SizedBox(height: 24),
                const Text('Audit Trail', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('${data.auditTrail.length} request(s) found',
                    style: const TextStyle(color: Colors.black54, fontSize: 13)),
                const SizedBox(height: 12),
                if (data.auditTrail.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.only(top: 32),
                      child: Text('No request history found for this user.',
                          style: TextStyle(color: Colors.black54)),
                    ),
                  )
                else
                  ...data.auditTrail.map((item) => _buildAuditCard(item)).toList(),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildUserSummary(UserAuditSummary user) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('User Information',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                StatusBadge(status: user.status),
              ],
            ),
            const Divider(height: 24),
            _buildDetailRow('Name', user.name),
            _buildDetailRow('Email', user.email),
            _buildDetailRow('Phone', user.phone),
            _buildDetailRow('Role', user.role.toUpperCase()),
            _buildDetailRow('Registered On',
                DateFormat('MMM dd, yyyy - hh:mm a').format(user.registrationDate.toLocal())),
          ],
        ),
      ),
    );
  }

  Widget _buildAuditCard(UserAuditEntity item) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('${item.type}: ${item.details}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                StatusBadge(status: item.status),
              ],
            ),
            const SizedBox(height: 12),
            _buildDetailRow('Submitted At',
                DateFormat('MMM dd, yyyy - hh:mm a').format(item.submittedAt.toLocal())),
            _buildDetailRow('Resolved At',
                DateFormat('MMM dd, yyyy - hh:mm a').format(item.updatedAt.toLocal())),
            _buildDetailRow('Actioned By', item.approvedBy),
            if (item.adminNote.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: Colors.amber.shade50, borderRadius: BorderRadius.circular(8)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Internal Note',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange)),
                    const SizedBox(height: 4),
                    Text(item.adminNote, style: const TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ],
            if (item.publicNote.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Public Note',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue)),
                    const SizedBox(height: 4),
                    Text(item.publicNote, style: const TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 13, color: Colors.black54)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}
