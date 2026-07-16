import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shared/infrastructure';

import type { IProfileExistenceService } from '../../domain/ports/profile-existence.service';

@Injectable()
export class PrismaProfileExistenceService implements IProfileExistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async agentExists(agentProfileId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: agentProfileId },
      select: { id: true },
    });
    return profile !== null;
  }

  async ownerExists(ownerProfileId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: ownerProfileId },
      select: { id: true },
    });
    return profile !== null;
  }
}
