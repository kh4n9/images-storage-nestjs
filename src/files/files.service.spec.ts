import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { getModelToken } from '@nestjs/mongoose';
import { Files } from './files.schema';
import { DiscordStorageService } from '../common/services/discord-storage.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getModelToken(Files.name), useValue: {} },
        { provide: DiscordStorageService, useValue: {} },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
