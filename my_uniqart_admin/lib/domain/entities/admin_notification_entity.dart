class AdminNotificationEntity {
  final String id;
  final String type;
  final String title;
  final String message;
  final String url;
  final String createdAt;
  bool isRead;

  AdminNotificationEntity({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.url,
    required this.createdAt,
    this.isRead = false,
  });

  factory AdminNotificationEntity.fromJson(Map<String, dynamic> json) {
    return AdminNotificationEntity(
      id: (json['id'] ?? json['_id'] ?? 'notif-${DateTime.now().millisecondsSinceEpoch}').toString(),
      type: (json['type'] ?? 'general').toString(),
      title: (json['title'] ?? 'Notification').toString(),
      message: (json['message'] ?? '').toString(),
      url: (json['url'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
      isRead: json['isRead'] == true,
    );
  }
}
