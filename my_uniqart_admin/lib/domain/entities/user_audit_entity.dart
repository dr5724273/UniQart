class UserAuditEntity {
  final String id;
  final String type; // "Vehicle", "Finance Offer", "Booking", "Loan Request"
  final String details;
  final DateTime submittedAt;
  final DateTime updatedAt;
  final String adminNote;
  final String publicNote;
  final String status;
  final String approvedBy;

  UserAuditEntity({
    required this.id,
    required this.type,
    required this.details,
    required this.submittedAt,
    required this.updatedAt,
    required this.adminNote,
    required this.publicNote,
    required this.status,
    required this.approvedBy,
  });

  factory UserAuditEntity.fromJson(Map<String, dynamic> json) {
    return UserAuditEntity(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      details: json['details'] as String? ?? '',
      submittedAt: json['submittedAt'] != null ? DateTime.parse(json['submittedAt']).toLocal() : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']).toLocal() : DateTime.now(),
      adminNote: json['adminNote'] as String? ?? '',
      publicNote: json['publicNote'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      approvedBy: json['approvedBy'] as String? ?? 'None',
    );
  }
}

class UserAuditResultEntity {
  final UserAuditSummary user;
  final List<UserAuditEntity> auditTrail;

  UserAuditResultEntity({
    required this.user,
    required this.auditTrail,
  });

  factory UserAuditResultEntity.fromJson(Map<String, dynamic> json) {
    final auditList = json['auditTrail'] as List? ?? [];
    return UserAuditResultEntity(
      user: UserAuditSummary.fromJson(json['user'] ?? {}),
      auditTrail: auditList.map((e) => UserAuditEntity.fromJson(e)).toList(),
    );
  }
}

class UserAuditSummary {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final DateTime registrationDate;
  final String status;

  UserAuditSummary({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.registrationDate,
    required this.status,
  });

  factory UserAuditSummary.fromJson(Map<String, dynamic> json) {
    return UserAuditSummary(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? '',
      registrationDate: json['registrationDate'] != null ? DateTime.parse(json['registrationDate']).toLocal() : DateTime.now(),
      status: json['status'] as String? ?? '',
    );
  }
}
