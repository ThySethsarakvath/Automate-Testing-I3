import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private idCounter = 1;

  create(createProductDto: CreateProductDto): Product {
    const newProduct: Product = {
      id: this.idCounter++,
      ...createProductDto,
    };
    this.products.push(newProduct);
    return newProduct;
  }

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto): Product {
    const product = this.findOne(id);
    const index = this.products.findIndex((p) => p.id === id);
    const updatedProduct: Product = { ...product, ...updateProductDto };
    this.products[index] = updatedProduct;
    return updatedProduct;
  }

  remove(id: number): { deleted: boolean } {
    this.findOne(id); // Throws 404 if not found
    this.products = this.products.filter((p) => p.id !== id);
    return { deleted: true };
  }
}
