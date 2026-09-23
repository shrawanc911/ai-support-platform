from enum import Enum


class TicketCategory(str, Enum):
    PAYMENT = "PAYMENT"
    REFUND = "REFUND"
    ACCOUNT = "ACCOUNT"
    TECHNICAL = "TECHNICAL"
    SHIPPING = "SHIPPING"
    SUBSCRIPTION = "SUBSCRIPTION"
    ORDER = "ORDER"
    OTHER = "OTHER"


class Sentiment(str, Enum):
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"