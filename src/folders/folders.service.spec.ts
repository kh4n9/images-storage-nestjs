import { Test, TestingModule } from '@nestjs/testing';
import { FoldersService } from './folders.service';
import { getModelToken } from '@nestjs/mongoose';
import { Folders } from './folders.schema';
import { FilesService } from '../files/files.service';

describe('FoldersService', () => {
  let service: FoldersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        { provide: getModelToken(Folders.name), useValue: {} },
        { provide: FilesService, useValue: {} },
      ],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
