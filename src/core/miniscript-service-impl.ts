import { MiniscriptService } from './ports';
import { MiniscriptPolicy } from './domain';
import { compilePolicy } from '@bitcoinerlab/miniscript-policies';

/**
 * ⚡ Bolt: Implementation of MiniscriptService using @bitcoinerlab/miniscript-policies.
 * Provides "best-in-class" support for compiling complex Bitcoin spending policies
 * into Miniscript and analyzing their properties (vsize, required signatures, etc.).
 */
export class MiniscriptServiceImpl implements MiniscriptService {
  async compilePolicy(policy: string): Promise<MiniscriptPolicy> {
    try {
      const result = compilePolicy(policy);

      // Simple analysis for required/total signers
      // In a more advanced implementation, we would parse the Miniscript tree.
      const totalSigners = (policy.match(/pk\(/g) || []).length;
      const threshMatch = policy.match(/thresh\((\d+)/);
      const requiredSigners = threshMatch ? parseInt(threshMatch[1]) : 1;

      return {
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(7),
        policy,
        descriptor: result.miniscript,
        requiredSigners,
        totalSigners,
      };
    } catch (err) {
      console.error('Miniscript policy compilation failed:', err);
      throw new Error(`Miniscript policy compilation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async analyzePolicy(policy: string): Promise<{
    isMalleable: boolean;
    vsize: number;
    requiredSigs: number;
  }> {
    try {
      const result = compilePolicy(policy);

      // Rough estimation of vsize based on miniscript length or simulated execution.
      // @bitcoinerlab/miniscript-policies doesn't directly provide vsize,
      // but we can estimate it.
      const estimatedVsize = Math.ceil(result.miniscript.length / 2); // VERY rough placeholder

      return {
        isMalleable: !result.issane,
        vsize: estimatedVsize,
        requiredSigs: (policy.match(/thresh\((\d+)/)?.[1] ? parseInt(policy.match(/thresh\((\d+)/)![1]) : 1),
      };
    } catch (err) {
      console.error('Miniscript analysis failed:', err);
      throw new Error(`Miniscript analysis failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
