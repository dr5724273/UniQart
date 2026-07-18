class LoanRequestEntity {
  final String id;
  final String buyerName;
  final String buyerEmail;
  final String buyerPhone;
  final String lenderName;
  final String lenderEmail;
  final double requestedAmount;
  final int durationMonths;
  final String employmentStatus;
  final double monthlyIncome;
  final String collateralType;
  final String collateralDescription;
  final String status;
  final String createdAt;

  const LoanRequestEntity({
    required this.id,
    required this.buyerName,
    required this.buyerEmail,
    required this.buyerPhone,
    required this.lenderName,
    required this.lenderEmail,
    required this.requestedAmount,
    required this.durationMonths,
    required this.employmentStatus,
    required this.monthlyIncome,
    required this.collateralType,
    required this.collateralDescription,
    required this.status,
    required this.createdAt,
  });
}
