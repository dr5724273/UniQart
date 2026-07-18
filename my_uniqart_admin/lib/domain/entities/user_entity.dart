class UserEntity {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String status;

  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.status,
  });

  bool get isAdmin => role == 'admin';
}
