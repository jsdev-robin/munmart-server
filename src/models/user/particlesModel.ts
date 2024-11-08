import { Schema } from 'mongoose';
import { IAddress, ICard, IPurchase } from '../../types/models/userModel';

export const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

export const CardSchema = new Schema<ICard>({
  cardNumber: { type: String, required: true },
  cardHolderName: { type: String, required: true },
  expirationDate: { type: String, required: true },
  billingAddress: { type: AddressSchema, required: true },
});

export const PurchaseSchema = new Schema<IPurchase>({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
});
