class BookingEntity {
  final String id;
  final String vehicleId;
  final String vehicleBrand;
  final String vehicleModel;
  final int vehicleYear;
  final int pricePerDay;
  
  final String buyerId;
  final String buyerName;
  final String buyerEmail;
  final String buyerPhone;

  final String listerId;
  final String listerName;
  final String listerEmail;
  final String listerPhone;

  final DateTime pickupDate;
  final DateTime returnDate;
  final String address;
  final String status;
  final String? adminNote;
  final String? publicNote;
  final DateTime createdAt;

  BookingEntity({
    required this.id,
    required this.vehicleId,
    required this.vehicleBrand,
    required this.vehicleModel,
    required this.vehicleYear,
    required this.pricePerDay,
    required this.buyerId,
    required this.buyerName,
    required this.buyerEmail,
    required this.buyerPhone,
    required this.listerId,
    required this.listerName,
    required this.listerEmail,
    required this.listerPhone,
    required this.pickupDate,
    required this.returnDate,
    required this.address,
    required this.status,
    this.adminNote,
    this.publicNote,
    required this.createdAt,
  });

  int get totalDays {
    final difference = returnDate.difference(pickupDate).inDays;
    return difference > 0 ? difference : 1;
  }

  int get totalPrice => totalDays * pricePerDay;
}
